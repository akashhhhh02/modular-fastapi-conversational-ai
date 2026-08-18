from typing import Sequence
import pytest
from starlette.testclient import TestClient

from backend.app.api.deps import get_llm_service
from backend.app.main import create_app
from backend.app.schemas.chat import ChatMessageItem
from backend.app.services.base import BaseLLMService


class MockLLMService(BaseLLMService):
    """Mock LLM implementation for automated test verification."""

    def __init__(self, response_prefix: str = "Mock response:") -> None:
        self.response_prefix = response_prefix
        self.received_messages: list[tuple[str, list[ChatMessageItem]]] = []

    async def generate_response(
        self,
        message: str,
        history: Sequence[ChatMessageItem] | None = None,
    ) -> str:
        history_list = list(history) if history else []
        self.received_messages.append((message, history_list))
        return f"{self.response_prefix} Echoing '{message}' with {len(history_list)} history items."


@pytest.fixture
def mock_llm_service() -> MockLLMService:
    """Fixture providing a mock LLM service instance."""
    return MockLLMService()


@pytest.fixture
def test_app(mock_llm_service: MockLLMService):
    """Fixture providing a configured FastAPI app with mocked LLM dependency."""
    app = create_app()
    app.dependency_overrides[get_llm_service] = lambda: mock_llm_service
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
def client(test_app) -> TestClient:
    """Fixture providing a TestClient connected to test_app."""
    return TestClient(test_app)
