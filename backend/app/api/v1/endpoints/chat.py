from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.api.deps import get_llm_service
from backend.app.core.exceptions import AppException, LLMServiceError
from backend.app.schemas.chat import ChatRequest, ChatResponse
from backend.app.services.base import BaseLLMService

router = APIRouter()


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with AI Assistant",
    description="Send a user prompt and optional conversation history to receive an AI generated response.",
)
async def chat_with_ai(
    payload: ChatRequest,
    service: BaseLLMService = Depends(get_llm_service),
) -> ChatResponse:
    """Handle chat interaction with the AI assistant."""
    trimmed_message = payload.message.strip()
    if not trimmed_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty or whitespace only.",
        )

    try:
        reply = await service.generate_response(
            message=trimmed_message,
            history=payload.history,
        )
        return ChatResponse(reply=reply)
    except AppException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat generation encountered an unexpected error: {str(exc)}",
        ) from exc
