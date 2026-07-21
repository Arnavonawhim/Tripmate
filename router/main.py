from fastapi import FastAPI
from pydantic import BaseModel
from config import ACTIVE_MODELS, Provider
from consensus import run_consensus
from contextlib import asynccontextmanager
from db import init_db, close_db, model_stats

@asynccontextmanager
async def lifespan(app: FastAPI):     
    await init_db()
    yield
    await close_db()
app = FastAPI(title="Consensus Router", lifespan=lifespan)

class AskRequest(BaseModel):
    prompt: str

@app.get("/health")
async def health():
    return {"status": "ok"}
    
@app.get("/models")
async def models():
    return [
    {"name": m.name, "provider": m.provider, "model": m.model}
    for m in ACTIVE_MODELS]
    
@app.post("/ask")
async def ask(req: AskRequest):
    return await run_consensus(req.prompt)

@app.get("/metrics/models")
async def metrics_models():
    return await model_stats()