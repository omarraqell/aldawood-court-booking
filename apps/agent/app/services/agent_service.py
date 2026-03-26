"""Main agent service: runs the deterministic LangGraph pipeline."""
import logging

from langchain_core.messages import AIMessage, HumanMessage

from app.graph.builder import graph
from app.tools.backend_tools import (
    append_message,
    get_context,
    set_tool_context,
    update_conversation,
)

logger = logging.getLogger(__name__)


class AgentService:
    async def run(self, message: str, phone: str, conversation_id: str) -> dict:
        # 1. Load context from backend
        context = await get_context(phone, conversation_id)
        conversation = context.get("conversation", {}) or {}
        customer = context.get("customer", {}) or {}
        policies = context.get("policies", {}) or {}
        raw_packages = context.get("packages", {})
        packages = raw_packages.get("items", []) if isinstance(raw_packages, dict) else raw_packages or []
        active_bookings = context.get("activeBookings", []) or []

        conv_id = conversation_id or conversation.get("id", "")
        customer_id = customer.get("id", "")

        # 2. Set context vars for backend functions
        set_tool_context(conv_id, customer_id, phone)

        # 3. Persist user message
        if conv_id:
            await append_message(conv_id, "user", message)

        # 4. Rebuild message history from backend conversation
        history = _build_history(conversation.get("messages", []) if isinstance(conversation, dict) else [])
        history.append(HumanMessage(content=message))

        # 5. Run the deterministic graph: extract → route → execute → respond
        result = await graph.ainvoke({
            "messages": history,
            "conversation_id": conv_id,
            "customer_phone": phone,
            "customer": customer,
            "policies": policies,
            "packages": packages,
            "active_bookings": active_bookings,
            "extracted_intent": "",
            "extracted_data": {},
            "execution_result": {},
        })

        # 6. Get reply from graph state
        execution_result = result.get("execution_result", {})
        reply = execution_result.get("reply", "")

        # 7. Persist assistant reply
        if conv_id and reply:
            await append_message(conv_id, "assistant", reply)
            await update_conversation(conv_id, {
                "status": "waiting_customer",
                "summary": reply[:500],
            })

        return {
            "conversationId": conv_id,
            "message": reply,
            "language": _detect_language(reply),
        }


def _build_history(messages: list[dict]) -> list:
    """Convert stored messages to LangChain message objects (last 20 messages)."""
    history = []
    for msg in messages[-20:]:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role == "user":
            history.append(HumanMessage(content=content))
        elif role == "assistant":
            history.append(AIMessage(content=content))
    return history


def _detect_language(text: str) -> str:
    if any("\u0600" <= c <= "\u06FF" for c in text):
        return "ar"
    return "en"


agent_service = AgentService()
