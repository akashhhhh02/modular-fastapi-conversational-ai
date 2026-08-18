"""Server entrypoint runner script."""
import uvicorn
from backend.app.core.config import get_settings


def start() -> None:
    """Start the Uvicorn ASGI server."""
    settings = get_settings()
    uvicorn.run(
        "backend.app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )


if __name__ == "__main__":
    start()
