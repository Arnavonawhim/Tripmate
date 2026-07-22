import base64, json, re
from config import ACTIVE_VISION
from providers import call_vision

INSTRUCTIONS = (
    "You are a travel assistant looking at a photo a traveler just took. "
    "Answer their question about the scene helpfully and concisely. "
    "Also transcribe any readable text in the image (signs, menus, labels); "
    "if there is none, use an empty string. "
    'Respond with ONLY minified JSON: {"answer": "...", "text_found": "..."}.'
)

def _parse_json(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return {"answer": text.strip(), "text_found": ""}
    try:
        data = json.loads(match.group(0))
        return {"answer": str(data.get("answer", "")).strip(),
                "text_found": str(data.get("text_found", "")).strip()}
    except json.JSONDecodeError:
        return {"answer": text.strip(), "text_found": ""}

async def describe_scene(client, image_bytes, question, mime_type="image/jpeg") -> dict:
    """Try each active provider in order; return the first success (same
    failover idea as the router — move on when one is down or rate-limited)."""
    if not ACTIVE_VISION:
        raise RuntimeError("no vision providers configured (set groq_api or gemini_api)")
    b64 = base64.b64encode(image_bytes).decode()
    data_uri = f"data:{mime_type};base64,{b64}"
    q = question.strip() or "What is this? Describe it for a traveler."
    prompt = f"{INSTRUCTIONS}\n\nTraveler's question: {q}"

    errors = []
    for provider in ACTIVE_VISION:
        try:
            result = _parse_json(await call_vision(client, provider, data_uri, prompt))
            result["provider"] = provider.name
            return result
        except Exception as e:
            errors.append(f"{provider.name}: {e}")
    raise RuntimeError("all vision providers failed -> " + " | ".join(errors))