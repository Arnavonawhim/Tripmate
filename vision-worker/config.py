import os 
from dataclasses import dataclass
from dotenv import load_dotenv
load_dotenv()

@dataclass
class VisionProvider:
    name: str
    base_url: str
    api_key: str
    model: str

VISION_PROVIDERS = [
    VisionProvider("groq",
        "https://api.groq.com/openai/v1/chat/completions",
        os.environ.get("groq_api", ""),
        os.environ.get("groq_vision_model", "meta-llama/llama-4-scout-17b-16e-instruct")),
    VisionProvider("gemini",
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        os.environ.get("gemini_api", ""),
        os.environ.get("gemini_vision_model", "gemini-2.0-flash")),
]

ACTIVE_VISION = [p for p in VISION_PROVIDERS if p.api_key] 
