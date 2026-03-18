from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    phone: str | None = None
    conversation_id: str | None = None
