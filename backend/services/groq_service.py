"""Backward compatibility bridge for GroqService."""
from backend.app.services.groq_service import GroqService
from backend.app.services.base import BaseLLMService

__all__ = ["GroqService", "BaseLLMService"]
