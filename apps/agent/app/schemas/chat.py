from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str
    phone: str | None = None
    conversation_id: str | None = Field(None, alias="conversationId")

    model_config = {"populate_by_name": True}
