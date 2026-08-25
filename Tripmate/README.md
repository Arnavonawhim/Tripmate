# Trip-Mate - real-time multi-model AI travel gateway (MVP)

Ask anything: the **consensus router** fans your prompt out to several LLMs in parallel and
picks the best answer (semantic voting or LLM-as-judge). Point your camera at a landmark,
menu or sign: the **vision worker** identifies it, reads and translates text, and answers
your question (Groq -> Gemini failover + image-hash caching). The **web client** ties it
together with token streaming and a live per-model metrics dashboard backed by Postgres.

## Architecture

~~~
client (Next.js, :3000)
  |-- POST /ask, /stream, GET /models, /metrics/models --> router (FastAPI, :8000)
  |     |-- Groq / Gemini / Ollama (parallel fan-out, consensus voting)
  |     |-- Redis    (response cache, 1h TTL)
  |     +-- Postgres (model_calls metrics: latency, tokens, win rate)
  +-- POST /scene ----------------------------------> vision-worker (FastAPI, :8001)
        |-- Groq -> Gemini failover (VLM reads text inline, no local OCR)
        +-- Redis (image-hash cache, 24h TTL)
~~~

## Repo layout

~~~
trip-mate/
  docker-compose.yml   # Redis + Postgres(pgvector) for local dev
  router/              # consensus router service
  vision-worker/       # scene Q&A service
  client/              # Next.js web client
~~~

## Prerequisites

- Python 3.11+, Node.js 18+, Docker
- Free API keys: [Groq](https://console.groq.com) and [Google AI Studio](https://aistudio.google.com)
- Optional (local models + semantic voting): [Ollama](https://ollama.com) with
  `llama3.2`, `qwen2.5:3b`, `nomic-embed-text`

## 1. Environment files

`router/.env`

~~~
groq_api=YOUR_GROQ_KEY
gemini_api=YOUR_GEMINI_KEY
# optional overrides:
# redis_url=redis://localhost:6379
# database_url=postgresql://postgres:postgres@localhost:5432/tripmate
# allowed_origins=*
# embed_url=http://localhost:11434/v1/embeddings
~~~

`vision-worker/.env`

~~~
groq_api=YOUR_GROQ_KEY
gemini_api=YOUR_GEMINI_KEY
# redis_url=redis://localhost:6379
# allowed_origins=*
~~~

`client/.env.local`

~~~
NEXT_PUBLIC_ROUTER_URL=http://localhost:8000
NEXT_PUBLIC_VISION_URL=http://localhost:8001
~~~

`client/.gitignore`

~~~
node_modules/
.next/
.env.local
~~~

## 2. Start infrastructure

~~~
docker compose up -d        # Redis :6379, Postgres :5432
~~~

## 3. Run the services (three terminals)

~~~
# terminal 1 - router
cd router
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# terminal 2 - vision worker
cd vision-worker
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# terminal 3 - client
cd client
npm install
npm run dev                 # http://localhost:3000
~~~

## 4. Smoke tests

~~~
curl http://localhost:8000/health
curl http://localhost:8001/health
curl -X POST http://localhost:8000/ask -H "Content-Type: application/json" -d '{"prompt": "Best time of day to visit the Taj Mahal?", "strategy": "judge"}'
curl -X POST http://localhost:8001/scene -F "image=@photo.jpg" -F "question=What is this?"
~~~

Then open http://localhost:3000 and try all four tabs (Ask / Stream / Vision / Metrics).

## 5. Deploy

| Piece | Where | Notes |
| --- | --- | --- |
| Redis | Upstash (free) | set `redis_url` on router **and** vision-worker |
| Postgres | Neon or Railway (free) | set `database_url` on router |
| router | Railway / Render | Dockerfile provided; env: `groq_api`, `gemini_api`, `redis_url`, `database_url`, `allowed_origins=https://YOUR-CLIENT.vercel.app` |
| vision-worker | Railway / Render | Dockerfile provided; env: `groq_api`, `gemini_api`, `redis_url`, `allowed_origins` |
| client | Vercel | root directory `client/`; env: `NEXT_PUBLIC_ROUTER_URL`, `NEXT_PUBLIC_VISION_URL` set to the deployed service URLs |

**Cloud notes**

- No Ollama in the cloud: `/ask` with `strategy=semantic` falls back to fastest-response
  unless you set `embed_url` to a hosted embeddings endpoint. `strategy=judge` works
  fully in the cloud - the client lets you pick either per request.
- Groq rotates vision model ids - verify the id in `vision-worker/config.py` against
  Groq's current model list.

## API summary

| Endpoint | Service | What it does |
| --- | --- | --- |
| `POST /ask` | router | `{prompt, strategy}` -> parallel fan-out + consensus answer with per-model candidates |
| `POST /stream` | router | `{prompt}` -> SSE token stream from the primary (cloud-preferred) model |
| `GET /models` | router | active models (depends on which API keys are set) |
| `GET /metrics/models` | router | per-model win rate / avg latency / avg agreement |
| `GET /health` | both | liveness |
| `POST /scene` | vision-worker | multipart `image` + `question` -> scene answer with provider + cache info |
