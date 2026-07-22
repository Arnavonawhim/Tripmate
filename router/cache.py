import os 
import json 
import hashlib
import redis.asyncio as redis 
from config import ACTIVE_MODELS

ROUTER_VERSION = "v1-semantic-consensus"
redis_url = os.environ.get("redis_url", "redis://localhost:6379")
Cache_TTL = 3600

_client = redis.from_url(redis_url, decode_responses=True)
def cache_key(prompt: str, strategy: str="semantic") -> str:
    normalized = prompt.strip().lower()
    models = ",".join(sorted(m.name for m in ACTIVE_MODELS))
    raw = f"{ROUTER_VERSION}|{strategy}|{models}|{normalized}"
    digest = hashlib.sha256(raw.encode()).hexdigest()
    return f"ask:{digest}"

async def get_cached(prompt: str, strategy: str="semantic") -> dict | None:
    try:
        raw = await _client.get(cache_key(prompt,strategy))
        return json.loads(raw) if raw else None
    except Exception:
        return None  

async def set_cached(prompt: str, value: dict, strategy: str="semantic") -> None:
    try:
        await _client.set(cache_key(prompt,strategy), json.dumps(value), ex=Cache_TTL)
    except Exception:
        pass

