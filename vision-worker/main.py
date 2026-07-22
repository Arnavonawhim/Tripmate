import os
import httpx
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from config import ACTIVE_VISION_PROVIDERS
from cache import get_cached, set_cached
from vision import ask_vision

MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8 MB

app = FastAPI(title="Vision Worker")

allowed_origins = os.environ.get("allowed_origins", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins.split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "providers": [p.name for p in ACTIVE_VISION_PROVIDERS]}

@app.post("/scene")
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

    cached = await get_cached(image_bytes, question)
    if cached is not None:
        cached["cached"] = True
        return cached

    async with httpx.AsyncClient() as client:
        result = await ask_vision(
            client, image_bytes, image.content_type or "image/jpeg", question)

    result["cached"] = False
    if result["ok"]:
        await set_cached(image_bytes, question, result)
    return result
