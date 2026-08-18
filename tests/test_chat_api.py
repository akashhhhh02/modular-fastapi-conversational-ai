import pytest
from starlette.testclient import TestClient


def test_health_check_endpoint(client: TestClient):
    """Test the /api/health endpoint returns 200 and valid JSON."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "model" in data


def test_chat_successful_response(client: TestClient):
    """Test standard chat completion via /api/chat."""
    payload = {
        "message": "Hello AI",
        "history": [
            {"role": "user", "content": "Initial question"},
            {"role": "assistant", "content": "Initial answer"},
        ],
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "Hello AI" in data["reply"]
    assert "2 history items" in data["reply"]


def test_chat_v1_endpoint_alias(client: TestClient):
    """Test /api/v1/chat endpoint alias works identically."""
    payload = {"message": "Testing v1 endpoint"}
    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 200
    assert "Testing v1 endpoint" in response.json()["reply"]


def test_chat_empty_message_validation(client: TestClient):
    """Test sending an empty message returns 400 Bad Request."""
    payload = {"message": "   "}
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"]


def test_chat_missing_message_field(client: TestClient):
    """Test missing message field returns 422 Unprocessable Entity."""
    response = client.post("/api/chat", json={})
    assert response.status_code == 422
