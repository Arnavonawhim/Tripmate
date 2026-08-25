import httpx
from config import VisionProvider

async def call_vision(client, provider, data_uri, prompt, timeout=60.0) -> str:
    headers = {"Authorization": f"Bearer {provider.api_key}"}
    payload = {
        "model": provider.model,
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": data_uri}},
        ]}],
    }
    resp = await client.post(provider.base_url, headers=headers, json=payload, timeout=timeout)
    if resp.status_code >= 400:
        raise RuntimeError(f"{provider.name} HTTP {resp.status_code}: {resp.text[:300]}")
    return resp.json()["choices"][0]["message"]["content"]