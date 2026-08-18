from typing import Literal
from pydantic import BaseModel, Field


class ChatMessageItem(BaseModel):
    """Schema for a single chat message item in conversation history."""

    role: Literal["user", "assistant", "system"] = Field(
        ...,
        description="The role of the message author.",
        examples=["user", "assistant"],
    )
    content: str = Field(
        ...,
        min_length=1,
        description="The content of the message.",
        examples=["Hello, how can you help me?"],
    )


class ChatRequest(BaseModel):
    """Request payload schema for AI chat endpoint."""

    message: str = Field(
        ...,
        min_length=1,
        description="User message prompt to send to the AI.",
        examples=["Explain SOLID principles in Python."],
    )
    history: list[ChatMessageItem] = Field(
        default_factory=list,
        description="Previous message turn history to maintain context.",
    )


# Alias for backward compatibility if any client imports ChatMessage
ChatMessage = ChatRequest


class ChatResponse(BaseModel):
    """Response payload schema for AI chat endpoint."""

    reply: str = Field(..., description="Assistant response text.")


class HealthResponse(BaseModel):
    """Response schema for application health status."""

    status: str = Field(default="ok", description="Health status.")
    version: str = Field(..., description="Application version.")
    model: str = Field(..., description="Active LLM model.")
