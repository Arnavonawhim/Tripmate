from fastapi import FastAPI
from pydantic import BaseModel
from config import ACTIVE_MODELS, Provider
from consensus import run_consensus

app = FastAPI(title="Consensus Router")
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