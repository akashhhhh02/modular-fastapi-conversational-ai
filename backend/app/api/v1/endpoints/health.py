from fastapi import APIRouter, Depends
from backend.app.core.config import Settings, get_settings
from backend.app.schemas.chat import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Check application and LLM configuration health status.",
)
async def health_check(
    settings: Settings = Depends(get_settings),
) -> HealthResponse:
    """Return health and status metadata."""
    return HealthResponse(
        status="ok",
        version=settings.app_version,
        model=settings.groq_model,
    )
