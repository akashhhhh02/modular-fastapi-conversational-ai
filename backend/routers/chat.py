"""Backward compatibility bridge for chat router."""
from backend.app.api.v1.endpoints.chat import router, chat_with_ai
from backend.app.schemas.chat import ChatMessage, ChatRequest, ChatResponse

__all__ = ["router", "chat_with_ai", "ChatMessage", "ChatRequest", "ChatResponse"]
