from abc import ABC, abstractmethod
from typing import Sequence
from backend.app.schemas.chat import ChatMessageItem


class BaseLLMService(ABC):
    """Abstract interface for LLM chat generation services (SOLID: OCP, LSP, ISP, DIP)."""

    @abstractmethod
    async def generate_response(
        self,
        message: str,
        history: Sequence[ChatMessageItem] | None = None,
    ) -> str:
        """
        Generate a conversational response from the underlying language model.

        :param message: The latest user prompt string.
        :param history: Optional sequence of previous chat messages.
        :return: Generated response string.
        :raises LLMServiceError: If generation fails.
        """
        pass
