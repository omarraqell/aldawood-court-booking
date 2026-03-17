from typing import Annotated, Any, Sequence

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(dict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    conversation_id: str
    customer_phone: str
    customer: dict[str, Any]
    policies: dict[str, Any]
    packages: list[dict[str, Any]]
    active_bookings: list[dict[str, Any]]
    preferred_language: str
