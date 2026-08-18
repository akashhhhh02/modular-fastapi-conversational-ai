"""Domain specific custom exceptions."""


class AppException(Exception):
    """Base exception for application errors."""

    def __init__(self, message: str, status_code: int = 500) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class LLMServiceError(AppException):
    """Raised when an error occurs in the LLM service layer."""

    def __init__(self, message: str, status_code: int = 500) -> None:
        super().__init__(message=message, status_code=status_code)


class LLMConfigurationError(LLMServiceError):
    """Raised when LLM service configuration (e.g., API key) is missing or invalid."""

    def __init__(self, message: str = "LLM API Key is not configured. Please set GROQ_API_KEY in .env.") -> None:
        super().__init__(message=message, status_code=503)


class LLMAPIError(LLMServiceError):
    """Raised when the LLM provider returns an API error."""

    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message=message, status_code=status_code)
