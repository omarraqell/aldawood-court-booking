"""Graph state definition for the deterministic agent pipeline."""
from typing import Annotated, Any, Sequence

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class AgentState(TypedDict):
    # Conversation
    messages: Annotated[Sequence[BaseMessage], add_messages]
    conversation_id: str
    customer_phone: str

    # Context from backend
    customer: dict[str, Any]
    policies: dict[str, Any]
    packages: list[dict[str, Any]]
    active_bookings: list[dict[str, Any]]

    # Pipeline data (set by nodes, flows through the graph)
    extracted_intent: str
    extracted_data: dict[str, Any]
    execution_result: dict[str, Any]  # includes "reply" after respond node
