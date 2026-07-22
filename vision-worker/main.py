import httpx
from fastapi import FastAPI, UploadFile, File, Form
from vision import describe_scene
from cache import get_cached, set_cached

app = FastAPI(title="TripMate Vision Worker")

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/scene")
async def scene(image: UploadFile = File(...),
                question: str = Form("What is this? Describe it for a traveler."),
                use_cache: bool = Form(True)):
    image_bytes = await image.read()
    mime_type = image.content_type or "image/jpeg"

    if use_cache:
        cached = await get_cached(image_bytes, question)
        if cached is not None:
            cached["cached"] = True
            return cached

    async with httpx.AsyncClient() as client:
        result = await describe_scene(client, image_bytes, question, mime_type=mime_type)

    result["cached"] = False
    if use_cache:
        await set_cached(image_bytes, question, result)
    return {"question": question, **result}