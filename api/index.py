import os
import json
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from api.config import ACTIVE_MODELS, ACTIVE_VISION_PROVIDERS
from api.consensus import run_consensus
from api.db import init_db, close_db, model_stats
from api.providers import stream_model
from api.cache import get_scene_cached, set_scene_cached
from api.vision import ask_vision

MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8 MB

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()

app = FastAPI(title="Trip-Mate Unified API", lifespan=lifespan)

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
    """Prefer a cloud model for /api/stream so it works without local Ollama RAM."""
    for m in ACTIVE_MODELS:
        if m.provider != "ollama":
            return m
    return ACTIVE_MODELS[0] if ACTIVE_MODELS else None

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "vision_providers": [p.name for p in ACTIVE_VISION_PROVIDERS]
    }

@app.get("/api/models")
async def models():
    return [
        {"name": m.name, "provider": m.provider, "model": m.model}
        for m in ACTIVE_MODELS
    ]

@app.get("/api/metrics/models")
async def metrics_models():
    return await model_stats()

@app.post("/api/stream")
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

@app.post("/api/ask")
async def ask(req: AskRequest):
    return await run_consensus(req.prompt, strategy=req.strategy)

@app.post("/api/scene")
async def scene(
    image: UploadFile = File(...),
    question: str = Form("What am I looking at?"),
):
    if not ACTIVE_VISION_PROVIDERS:
        return {"ok": False, "answer": None, "provider": None, "cached": False,
                "errors": ["no vision providers configured - set groq_api / gemini_api"]}

    image_bytes = await image.read()
    if not image_bytes:
        return {"ok": False, "answer": None, "provider": None, "cached": False,
                "errors": ["empty image upload"]}
    if len(image_bytes) > MAX_IMAGE_BYTES:
        return {"ok": False, "answer": None, "provider": None, "cached": False,
                "errors": [f"image too large (>{MAX_IMAGE_BYTES // (1024 * 1024)} MB)"]}

    cached = await get_scene_cached(image_bytes, question)
    if cached is not None:
        cached["cached"] = True
        return cached

    async with httpx.AsyncClient() as client:
        result = await ask_vision(
            client, image_bytes, image.content_type or "image/jpeg", question)

    result["cached"] = False
    if result["ok"]:
        await set_scene_cached(image_bytes, question, result)
    return result
