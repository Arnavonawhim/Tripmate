import os 
from dotenv import load_dotenv
from dataclasses import dataclass
load_dotenv()

@dataclass

class Provider:
    name: str
    base_url: str
    key_env: str|None=None 

    @property
    def api_key(self)->str|None:
        return os.environ.get(self.key_env) if self.key_env else None
    @property
    def available(self) -> bool:
        return self.key_env is None or bool(self.api_key)
    
@dataclass
class Model:
    name: str       
    provider: str    
    model: str          
    
PROVIDERS = {
    "ollama": Provider(
    "ollama",
    "http://localhost:11434/v1/chat/completions",),

    "groq": Provider(
    "groq",
    "https://api.groq.com/openai/v1/chat/completions",
    key_env="groq_api",),

    "gemini": Provider(
    "gemini",
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    key_env="gemini_api",),}

MODELS = [
Model("llama3.2 (local)", "ollama", "llama3.2"),
Model("qwen2.5 (local)", "ollama", "qwen2.5:3b"),
Model("llama-3.3-70b (groq)", "groq", "llama-3.3-70b-versatile"),
Model("gemini-2.0-flash", "gemini", "gemini-2.0-flash"),]

ACTIVE_MODELS = [m for m in MODELS if PROVIDERS[m.provider].available]