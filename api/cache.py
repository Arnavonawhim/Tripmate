import os 
import json 
import hashlib
import redis.asyncio as redis 
from api.config import ACTIVE_MODELS, ACTIVE_VISION_PROVIDERS

ROUTER_VERSION = "v1-semantic-consensus"
# Vercel KV provides KV_URL. Fallback to redis_url for local dev.
redis_url = os.environ.get("KV_URL", os.environ.get("redis_url", "redis://localhost:6379"))
Cache_TTL = 3600
VISION_CACHE_TTL = 60 * 60 * 24

_client = redis.from_url(redis_url, decode_responses=True)

def ask_cache_key(prompt: str, strategy: str="semantic") -> str:
    normalized = prompt.strip().lower()
    models = ",".join(sorted(m.name for m in ACTIVE_MODELS))
    raw = f"{ROUTER_VERSION}|{strategy}|{models}|{normalized}"
    digest = hashlib.sha256(raw.encode()).hexdigest()
    return f"ask:{digest}"

async def get_ask_cached(prompt: str, strategy: str="semantic") -> dict | None:
    try:
        raw = await _client.get(ask_cache_key(prompt,strategy))
        return json.loads(raw) if raw else None
    except Exception:
        return None  

async def set_ask_cached(prompt: str, value: dict, strategy: str="semantic") -> None:
    try:
        await _client.set(ask_cache_key(prompt,strategy), json.dumps(value), ex=Cache_TTL)
    except Exception:
        pass

def scene_cache_key(image_bytes: bytes, question: str) -> str:
    providers = ",".join(p.name for p in ACTIVE_VISION_PROVIDERS)
    h = hashlib.sha256()
    h.update(image_bytes)
    h.update(b"|")
    h.update(question.strip().lower().encode())
    h.update(b"|")
    h.update(providers.encode())
    return f"scene:{h.hexdigest()}"

async def get_scene_cached(image_bytes: bytes, question: str) -> dict | None:
    try:
        raw = await _client.get(scene_cache_key(image_bytes, question))
        return json.loads(raw) if raw else None
    except Exception:
        return None

async def set_scene_cached(image_bytes: bytes, question: str, value: dict) -> None:
    try:
        await _client.set(scene_cache_key(image_bytes, question), json.dumps(value), ex=VISION_CACHE_TTL)
    except Exception:
        pass
