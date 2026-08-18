# NovaChat AI — Next-Gen AI Assistant

NovaChat AI is a high-performance, modular conversational AI assistant built with **FastAPI**, **Groq (LLaMA 3.3 70B)**, and a modern Obsidian & Cyan glassmorphic web interface.

The codebase is engineered adhering strictly to **SOLID design principles**, clean layered architecture, non-blocking asynchronous execution, and automated testing.

---

## 🏛️ SOLID Principles Architecture

1. **Single Responsibility Principle (SRP)**:
   - `backend/app/core/config.py`: Environment configuration and application settings only.
   - `backend/app/core/exceptions.py`: Custom domain exceptions.
   - `backend/app/schemas/chat.py`: Pydantic Data Transfer Objects (DTOs) and request/response validation.
   - `backend/app/services/base.py`: Abstract LLM service interface contract.
   - `backend/app/services/groq_service.py`: AsyncGroq API integration and prompt orchestration.
   - `backend/app/api/v1/endpoints/chat.py`: Pure API controller layer handling HTTP request/response lifecycles.
   - `backend/app/main.py`: Application factory, middleware registration, and static file serving.

2. **Open/Closed Principle (OCP)**:
   - The system is open for extension but closed for modification. New LLM providers (e.g. OpenAI, Anthropic, MockLLM) can be added by implementing `BaseLLMService` without modifying existing route handlers.

3. **Liskov Substitution Principle (LSP)**:
   - Subclasses of `BaseLLMService` can be swapped interchangeably without altering system behavior or breaking API consumers.

4. **Interface Segregation Principle (ISP)**:
   - `BaseLLMService` exposes only the focused contract needed for chat completions (`generate_response`).

5. **Dependency Inversion Principle (DIP)**:
   - High-level API route handlers depend on abstractions (`BaseLLMService`) injected via FastAPI's `Depends(get_llm_service)` rather than instantiating concrete classes directly.

---

## 📁 Project Directory Structure

```
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py             # Dependency Injection (get_llm_service, get_settings)
│   │   │   └── v1/
│   │   │       ├── router.py       # API v1 Router aggregation
│   │   │       └── endpoints/
│   │   │           ├── chat.py     # POST /api/chat & POST /api/v1/chat
│   │   │           └── health.py   # GET /api/health endpoint
│   │   ├── core/
│   │   │   ├── config.py           # Cached Settings & env variables
│   │   │   └── exceptions.py       # Custom application exceptions
│   │   ├── schemas/
│   │   │   └── chat.py             # Pydantic models (ChatRequest, ChatResponse, etc.)
│   │   ├── services/
│   │   │   ├── base.py             # Abstract BaseLLMService (OCP / LSP / ISP)
│   │   │   └── groq_service.py     # Asynchronous Groq client implementation
│   │   └── main.py                 # FastAPI App Factory & static mounting
│   ├── main.py                     # Backward-compatibility runner
│   └── run.py                      # Server runner script
├── frontend/
│   ├── index.html                  # Semantic, accessible HTML5 interface
│   ├── styles.css                  # Obsidian & Cyan dark glassmorphic styling
│   └── app.js                      # Client controller with markdown, copy, & auto-scroll
├── tests/
│   ├── conftest.py                 # Pytest fixtures & MockLLMService
│   ├── test_chat_api.py            # API integration tests
│   └── test_services.py            # Unit tests for schemas and services
├── .env.example
├── pyproject.toml
└── requirements.txt
```

---

## 🚀 Quick Start

### 1. Environment Setup
Copy `.env.example` to `.env` and add your Groq API key:
```bash
cp .env.example .env
```
Edit `.env`:
```ini
GROQ_API_KEY=your_groq_api_key_here
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Server
Using Python module runner:
```bash
python -m backend.run
```
Or directly with Uvicorn:
```bash
uvicorn backend.app.main:app --reload --port 8000
```
Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

---

## 🧪 Running Automated Tests
Run the test suite with `pytest`:
```bash
pytest tests/ -v
```
All tests use a dependency-injected `MockLLMService`, executing in under 1 second without consuming API credits or requiring network connectivity.
