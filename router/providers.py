import os
import time
import httpx
import json
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

EMBED_URL = os.environ.get("embed_url", "http://localhost:11434/v1/embeddings")

async def embed_text(
    client: httpx.AsyncClient,
    text: str,
    base_url: str | None = None,
    model: str = "nomic-embed-text",
) -> list[float]:
    resp = await client.post(base_url or EMBED_URL, json={"model": model, "input": text})
    resp.raise_for_status()
    return resp.json()["data"][0]["embedding"]

async def stream_model(
    client: httpx.AsyncClient,
    model: Model,
    prompt: str,
    timeout: float = 60.0,
):
    provider = PROVIDERS[model.provider]
    headers = {}
    if provider.api_key:
        headers["Authorization"] = f"Bearer {provider.api_key}"

    payload = {
        "model": model.model,
        "messages": [{"role": "user", "content": prompt}],
        "stream": True,}
    
    async with client.stream(
        "POST", provider.base_url, headers=headers, json=payload, timeout=timeout
    ) as resp:
        if resp.status_code >= 400:
            body = await resp.aread()
            detail = body.decode(errors="replace").strip()[:500]
            raise RuntimeError(
                f"{model.model} @ {provider.name} returned "
                f"HTTP {resp.status_code}: {detail}"
            )

        async for line in resp.aiter_lines():
            if not line or not line.startswith("data:"):
                continue
            data = line[len("data:"):].strip()
            if data == "[DONE]":
                break
            try:
                chunk = json.loads(data)
                delta = chunk["choices"][0]["delta"].get("content")
                if delta:
                    yield delta
            except Exception:
                continue