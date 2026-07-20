import asyncio
import httpx
from config import  ACTIVE_MODELS
from providers import call_model 

async def run_consensus(prompt:str) -> dict:
    async with httpx.AsyncClient() as client:
        tasks=[call_model(client,m,prompt)for m in ACTIVE_MODELS]
        results = await asyncio.gather(*tasks)
    working = [r for r in results if r["ok"]]
    if not working:
        return {"answer": None, "chosen": None, "candidates": results}
    best = min(working, key=lambda r: r["latency_ms"])  
    return {
        "answer": best["text"],
        "chosen": best["name"],
        "candidates": results,}