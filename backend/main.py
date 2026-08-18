"""Re-export app for backward compatibility."""
from backend.app.main import app, create_app
from backend.app.core.config import settings

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.app.main:app", host=settings.host, port=settings.port, reload=True)
