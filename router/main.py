from fastapi import FastAPI
import json
import httpx
from pydantic import BaseModel
from config import ACTIVE_MODELS, Provider
from consensus import run_consensus
from contextlib import asynccontextmanager
from db import init_db, close_db, model_stats
from fastapi.responses import StreamingResponse
from providers import stream_model

@asynccontextmanager
async def lifespan(app: FastAPI):     
    await init_db()
    yield
    await close_db()
app = FastAPI(title="Consensus Router", lifespan=lifespan)

class AskRequest(BaseModel):
    prompt: str
    strategy: str = "semantic"   

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
    if not ACTIVE_MODELS:
        return {"error": "no active models"}
    primary = ACTIVE_MODELS[0]

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