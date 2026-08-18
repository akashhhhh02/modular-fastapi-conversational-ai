from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.app.api.v1.router import api_v1_router
from backend.app.core.config import get_settings
from backend.app.core.exceptions import AppException


def create_app() -> FastAPI:
    """Application factory for FastAPI instance."""
    settings = get_settings()

    application = FastAPI(
        title=settings.app_title,
        version=settings.app_version,
        description=settings.app_description,
    )

    # CORS configuration
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount static assets
    frontend_dir = settings.frontend_dir
    if frontend_dir.exists():
        application.mount(
            "/static",
            StaticFiles(directory=str(frontend_dir)),
            name="static",
        )

    # Register API routers - both /api/v1 and /api for backward compatibility
    application.include_router(api_v1_router, prefix="/api/v1")
    application.include_router(api_v1_router, prefix="/api")

    # Global domain exception handler
    @application.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
        )

    # Serve Single Page Application index
    @application.get("/", response_class=HTMLResponse, include_in_schema=False)
    async def serve_spa_index() -> HTMLResponse:
        index_file = frontend_dir / "index.html"
        if not index_file.exists():
            return HTMLResponse(
                "<h1>Frontend index.html not found.</h1>",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return HTMLResponse(content=index_file.read_text(encoding="utf-8"))

    return application


app = create_app()

if __name__ == "__main__":
    import uvicorn

    cfg = get_settings()
    uvicorn.run("backend.app.main:app", host=cfg.host, port=cfg.port, reload=True)
