import time
import httpx
from config import Model, LLMS
async def call_model(
    client: httpx.AsyncClient,
    model: Model,
    prompt: str,
    timeout: float = 30.0,
    ) -> dict:

    provider = LLMS[model.provider]  
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
            timeout=timeout,
        )
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
        "error": str(e),
        }