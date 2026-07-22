import os, json, hashlib
import redis.asyncio as redis
from config import ACTIVE_VISION

VISION_CACHE_VERSION = "vision-v1"
redis_url = os.environ.get("redis_url", "redis://localhost:6379")
CACHE_TTL = 86400   
_client = redis.from_url(redis_url, decode_responses=True)

def cache_key(image_bytes: bytes, question: str) -> str:
    providers = ",".join(p.name for p in ACTIVE_VISION)
    h = hashlib.sha256()
    h.update(VISION_CACHE_VERSION.encode()); h.update(providers.encode())
    h.update(question.strip().lower().encode()); h.update(image_bytes)
    return f"scene:{h.hexdigest()}"

async def get_cached(image_bytes, question):
    try:
        raw = await _client.get(cache_key(image_bytes, question))
        return json.loads(raw) if raw else None
    except Exception:
        return None

async def set_cached(image_bytes, question, value):
    try:
        await _client.set(cache_key(image_bytes, question), json.dumps(value), ex=CACHE_TTL)
    except Exception:
        pass