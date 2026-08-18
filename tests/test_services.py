import pytest
from backend.app.core.config import Settings
from backend.app.core.exceptions import LLMConfigurationError
from backend.app.schemas.chat import ChatMessageItem, ChatRequest, ChatResponse
from backend.app.services.base import BaseLLMService
from backend.app.services.groq_service import GroqService


def test_schema_serialization():
    """Verify chat schema serialization and validation."""
    item = ChatMessageItem(role="user", content="Test message")
    assert item.role == "user"
    assert item.content == "Test message"

    req = ChatRequest(message="Hello", history=[item])
    assert req.message == "Hello"
    assert len(req.history) == 1

    resp = ChatResponse(reply="Test reply")
    assert resp.reply == "Test reply"


@pytest.mark.asyncio
async def test_groq_service_missing_api_key():
    """Verify GroqService raises LLMConfigurationError when API key is missing."""
    settings = Settings()
    settings.groq_api_key = ""  # empty key
    service = GroqService(settings=settings)

    with pytest.raises(LLMConfigurationError) as exc_info:
        await service.generate_response(message="Hello")
    assert "GROQ_API_KEY is not set" in str(exc_info.value)
