import base64
import time
import httpx
from api.config import ACTIVE_VISION_PROVIDERS

SCENE_SYSTEM_PROMPT = (
    "You are Trip-Mate, an AI travel companion looking through the user's camera. "
    "Identify landmarks, buildings, dishes and objects when possible. If the image "
    "contains text (signs, menus, notices), transcribe the important parts and "
    "translate them to English. Answer the user's question directly and concisely "
    "(2-6 sentences), and add one genuinely useful travel tip when relevant."
)

async def ask_vision(
    client: httpx.AsyncClient,
    image_bytes: bytes,
    mime_type: str,
    question: str,
    timeout: float = 60.0,
) -> dict:
    b64 = base64.b64encode(image_bytes).decode()
    data_url = f"data:{mime_type};base64,{b64}"
    errors: list[str] = []

    for provider in ACTIVE_VISION_PROVIDERS:
        start = time.perf_counter()
        try:
            resp = await client.post(
                provider.base_url,
                headers={"Authorization": f"Bearer {provider.api_key}"},
                json={
                    "model": provider.model,
                    "messages": [
                        {"role": "system", "content": SCENE_SYSTEM_PROMPT},
                        {"role": "user", "content": [
                            {"type": "text", "text": question},
                            {"type": "image_url", "image_url": {"url": data_url}},
                        ]},
                    ],
                },
                timeout=timeout,)
            resp.raise_for_status()
            data = resp.json()
            return {
                "ok": True,
                "answer": data["choices"][0]["message"]["content"],
                "provider": provider.name,
                "model": provider.model,
                "latency_ms": round((time.perf_counter() - start) * 1000),
                "tokens": data.get("usage", {}).get("total_tokens"),
                "errors": errors,}
        except Exception as e:
            errors.append(f"{provider.name}: {e}")

    return {
        "ok": False,
        "answer": None,
        "provider": None,
        "model": None,
        "latency_ms": None,
        "tokens": None,
        "errors": errors,}
