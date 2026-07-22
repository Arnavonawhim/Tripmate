import os
import json
import hashlib
import redis.asyncio as redis
from config import ACTIVE_VISION_PROVIDERS

redis_url = os.environ.get("redis_url", "redis://localhost:6379")
CACHE_TTL = 60 * 60 * 24  # 24h - testing costs 1 call per unique image

_client = redis.from_url(redis_url, decode_responses=True)

def cache_key(image_bytes: bytes, question: str) -> str:
    providers = ",".join(p.name for p in ACTIVE_VISION_PROVIDERS)
    h = hashlib.sha256()
    h.update(image_bytes)
    h.update(b"|")
    h.update(question.strip().lower().encode())
    h.update(b"|")
    h.update(providers.encode())
    return f"scene:{h.hexdigest()}"

async def get_cached(image_bytes: bytes, question: str) -> dict | None:
    try:
        raw = await _client.get(cache_key(image_bytes, question))
        return json.loads(raw) if raw else None
    except Exception:
        return None

async def set_cached(image_bytes: bytes, question: str, value: dict) -> None:
    try:
        await _client.set(cache_key(image_bytes, question), json.dumps(value), ex=CACHE_TTL)
    except Exception:
        pass
