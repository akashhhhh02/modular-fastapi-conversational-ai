import re
import sys
from typing import Sequence

from backend.app.core.config import Settings, get_settings
from backend.app.core.exceptions import (
    LLMAPIError,
    LLMConfigurationError,
    LLMServiceError,
)
from backend.app.schemas.chat import ChatMessageItem
from backend.app.services.base import BaseLLMService


class GroqService(BaseLLMService):
    """Groq implementation of BaseLLMService using AsyncGroq client."""

    def __init__(
        self,
        settings: Settings | None = None,
    ) -> None:
        self._custom_settings = settings
        self._client = None
        self._current_key = None

    @property
    def settings(self) -> Settings:
        """Return the current settings instance."""
        return self._custom_settings or get_settings()

    @property
    def client(self):
        """Lazily and dynamically initialize and return the AsyncGroq client."""
        try:
            from groq import AsyncGroq
        except ImportError as exc:
            raise LLMConfigurationError(
                f"The 'groq' Python package is not installed for Python at {sys.executable}. "
                "Please run 'pip install -r requirements.txt' or activate your .venv."
            ) from exc

        api_key = self.settings.groq_api_key
        if not api_key:
            raise LLMConfigurationError(
                "GROQ_API_KEY is not set. Please add your Groq API key to .env file."
            )

        if self._client is None or self._current_key != api_key:
            self._client = AsyncGroq(api_key=api_key)
            self._current_key = api_key
        return self._client

    async def generate_response(
        self,
        message: str,
        history: Sequence[ChatMessageItem] | None = None,
    ) -> str:
        """
        Generate chat completion response asynchronously via Groq API.
        """
        if not message or not message.strip():
            raise LLMServiceError("Prompt message cannot be empty.", status_code=400)

        # Dynamic import of Groq exception classes
        try:
            from groq import APIError, AuthenticationError, RateLimitError
        except ImportError:
            class _GroqDummyError(Exception):
                pass
            APIError = _GroqDummyError  # type: ignore
            AuthenticationError = _GroqDummyError  # type: ignore
            RateLimitError = _GroqDummyError  # type: ignore

        current_settings = self.settings
        system_prompt = current_settings.system_prompt
        model_name = current_settings.groq_model

        # Build messages payload
        messages: list[dict[str, str]] = [
            {"role": "system", "content": system_prompt}
        ]

        if history:
            for item in history:
                if item.role in {"user", "assistant", "system"} and item.content.strip():
                    messages.append({"role": item.role, "content": item.content.strip()})

        messages.append({"role": "user", "content": message.strip()})

        try:
            client = self.client
            completion = await client.chat.completions.create(
                model=model_name,
                messages=messages,  # type: ignore
                temperature=current_settings.temperature,
                max_tokens=current_settings.max_tokens,
            )

            if not completion.choices or not completion.choices[0].message.content:
                raise LLMServiceError("No response received from Groq model.")

            choice = completion.choices[0]
            raw_content = choice.message.content or ""

            # Strip internal <think>...</think> reasoning tags if present
            cleaned_content = re.sub(r"<think>[\s\S]*?</think>", "", raw_content).strip()
            if not cleaned_content and raw_content:
                cleaned_content = raw_content.strip()

            # Check if generation was cut off abruptly due to token limit
            if getattr(choice, "finish_reason", None) == "length":
                # Ensure unclosed code blocks are gracefully closed
                if cleaned_content.count("```") % 2 != 0:
                    cleaned_content += "\n```\n"

                # Check if sentence ended abruptly
                if cleaned_content and not cleaned_content.rstrip().endswith((".", "!", "?", "```", "\n", ")", '"', "'")):
                    cleaned_content += "...\n\n*(Response reached token limit. Type 'continue' to expand further.)*"

            return cleaned_content

        except LLMConfigurationError:
            # Re-raise configuration errors directly so they are not masked as API errors
            raise
        except AuthenticationError as exc:
            raise LLMAPIError(
                f"Groq authentication failed: {str(exc)}. Please check your GROQ_API_KEY in .env.",
                status_code=401,
            ) from exc
        except RateLimitError as exc:
            raise LLMAPIError(
                f"Groq rate limit exceeded: {str(exc)}. Please wait a moment and retry.",
                status_code=429,
            ) from exc
        except APIError as exc:
            raise LLMAPIError(
                f"Groq API error ({getattr(exc, 'status_code', 'error')}): {str(exc)}",
                status_code=502,
            ) from exc
        except Exception as exc:
            raise LLMServiceError(f"Unexpected error during generation: {str(exc)}") from exc
