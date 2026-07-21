import time
import httpx
from config import Model, PROVIDERS
async def call_model(
    client: httpx.AsyncClient,
    model: Model,
    prompt: str,
    timeout: float = 30.0,
    ) -> dict:

    provider = PROVIDERS[model.provider]  
    start = time.perf_counter()
    headers = {}
    if provider.api_key:
        headers["Authorization"] = f"Bearer {provider.api_key}"
    try:
        resp = await client.post(
        provider.base_url,
        headers=headers,
        json={
            "model": model.model,
            "messages": [{"role": "user", "content": prompt}],},
            timeout=timeout,)
        resp.raise_for_status()
        data = resp.json()
        return {
            "name": model.name,
            "provider": provider.name,
            "ok": True,
            "text": data["choices"][0]["message"]["content"],
            "latency_ms": round((time.perf_counter() - start) * 1000),
            "tokens": data.get("usage", {}).get("total_tokens"),
            "error": None,}
    except Exception as e:
        return {
        "name": model.name,
        "provider": provider.name,
        "ok": False,
        "text": None,
        "latency_ms": round((time.perf_counter() - start) * 1000),
        "tokens": None,
        "error": str(e),}

async def embed_text(
    client: httpx.AsyncClient,
    text: str,
    base_url: str = "http://localhost:11434/v1/embeddings",
    model: str = "nomic-embed-text",
) -> list[float]:
    resp = await client.post(base_url, json={"model": model, "input": text})
    resp.raise_for_status()
    return resp.json()["data"][0]["embedding"]