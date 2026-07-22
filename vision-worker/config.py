import os
from dotenv import load_dotenv
from dataclasses import dataclass

load_dotenv()

@dataclass
class VisionProvider:
    name: str
    base_url: str
    model: str
    key_env: str

    @property
    def api_key(self) -> str | None:
        return os.environ.get(self.key_env)

    @property
    def available(self) -> bool:
        return bool(self.api_key)

VISION_PROVIDERS = [
    VisionProvider(
        "groq",
        "https://api.groq.com/openai/v1/chat/completions",
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "groq_api",),
    VisionProvider(
        "gemini",
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        "gemini-2.0-flash",
        "gemini_api",),]

ACTIVE_VISION_PROVIDERS = [p for p in VISION_PROVIDERS if p.available]
