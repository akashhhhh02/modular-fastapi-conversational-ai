from functools import lru_cache
from fastapi import Depends
from backend.app.core.config import Settings, get_settings
from backend.app.services.base import BaseLLMService
from backend.app.services.groq_service import GroqService


@lru_cache
def get_llm_service(
    settings: Settings = Depends(get_settings),
) -> BaseLLMService:
    """
    FastAPI dependency that provides an LLM service instance.
    Adheres to Dependency Inversion Principle (DIP).
    Can be easily overridden in tests with app.dependency_overrides[get_llm_service].
    """
    return GroqService(settings=settings)
