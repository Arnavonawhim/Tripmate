import os
import json
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from config import ACTIVE_MODELS
from consensus import run_consensus
from db import init_db, close_db, model_stats
from providers import stream_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()

app = FastAPI(title="Consensus Router", lifespan=lifespan)

allowed_origins = os.environ.get("allowed_origins", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    prompt: str
    strategy: str = "semantic"

def pick_primary():
    """Prefer a cloud model for /stream so it works without local Ollama RAM."""
    for m in ACTIVE_MODELS:
        if m.provider != "ollama":
            return m
    return ACTIVE_MODELS[0] if ACTIVE_MODELS else None

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/models")
async def models():
    return [
    {"name": m.name, "provider": m.provider, "model": m.model}
    for m in ACTIVE_MODELS]

@app.get("/metrics/models")
async def metrics_models():
    return await model_stats()

@app.post("/stream")
async def stream(req: AskRequest):
    primary = pick_primary()
    if primary is None:
        return {"error": "no active models"}

    async def event_gen():
        async with httpx.AsyncClient() as client:
            try:
                async for token in stream_model(client, primary, req.prompt):
                    yield f"data: {json.dumps({'delta': token})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")

@app.post("/ask")
async def ask(req: AskRequest):
    return await run_consensus(req.prompt, strategy=req.strategy)