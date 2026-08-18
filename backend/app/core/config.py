import os
from functools import lru_cache
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
load_dotenv(BASE_DIR / ".env", override=True)


class Settings:
    """Application configuration settings."""

    def __init__(self) -> None:
        load_dotenv(BASE_DIR / ".env", override=True)
        self.app_title: str = os.getenv("APP_TITLE", "NovaChat AI Assistant")
        self.app_version: str = os.getenv("APP_VERSION", "1.0.0")
        self.app_description: str = os.getenv(
            "APP_DESCRIPTION",
            "High-performance general-purpose AI assistant built with FastAPI, Groq, and modern UI design.",
        )
        self.host: str = os.getenv("HOST", "127.0.0.1")
        self.port: int = int(os.getenv("PORT", "8000"))
        self.groq_api_key: str = os.getenv("GROQ_API_KEY", "").strip()
        self.groq_model: str = os.getenv("GROQ_MODEL", "groq/compound-mini")
        self.temperature: float = float(os.getenv("TEMPERATURE", "0.3"))
        self.max_tokens: int = int(os.getenv("MAX_TOKENS", "4096"))
        self.system_prompt: str = os.getenv(
            "SYSTEM_PROMPT",
            "You are NovaChat, a highly intelligent, truthful, and rigorously accurate general-purpose AI assistant. "
            "Your top priority is high factual accuracy, truthfulness, and logical consistency across all subjects "
            "(including software engineering, science, mathematics, world history, official organizational structures, and data analysis).\n\n"
            "Core Directives:\n"
            "1. Factual Accuracy: Provide precise, truthful facts without inventing non-existent titles, ranks, or specifications.\n"
            "2. Attentive to Feedback & Corrections: Actively maintain conversation context. When the user points out a mistake or provides feedback, immediately reflect on the correction, acknowledge it politely, and correct yourself accurately.\n"
            "3. Structured & Complete: Always complete your thoughts, code blocks, lists, and tables cleanly. Conclude naturally without leaving thoughts cut off mid-way.\n"
            "4. Rich Formatting: Use Markdown tables, bold text, lists, and headers to present information cleanly.",
        )
        self.frontend_dir: Path = BASE_DIR / "frontend"


@lru_cache
def get_settings() -> Settings:
    """Provide a cached singleton instance of application settings."""
    return Settings()


# For convenience / backward compatibility
settings = get_settings()
