"""Backend API functions called by the executor node.

These are plain async functions (not LLM tools). The executor calls them
directly based on the extracted intent — no LLM decides which to call.
"""
from contextvars import ContextVar
from typing import Optional

from app.clients.backend_client import backend_client

# Context vars set before the graph runs — functions read these
_conversation_id: ContextVar[str] = ContextVar("conversation_id", default="")
_customer_id: ContextVar[str] = ContextVar("customer_id", default="")
_customer_phone: ContextVar[str] = ContextVar("customer_phone", default="")


def set_tool_context(conversation_id: str, customer_id: str, customer_phone: str) -> None:
    _conversation_id.set(conversation_id)
    _customer_id.set(customer_id)
    _customer_phone.set(customer_phone)


# ---------------------------------------------------------------------------
# Infrastructure helpers
# ---------------------------------------------------------------------------

async def get_context(phone: str, conversation_id: str, intent: str | None = None) -> dict:
    return await backend_client.post(
        "/internal/agent/context",
        {"phone": phone, "conversationId": conversation_id, "intent": intent},
    )


async def append_message(
    conversation_id: str,
    role: str,
    content: str,
    content_json: dict | list | None = None,
    tool_name: str | None = None,
) -> dict:
    payload: dict = {"role": role, "content": content}
    if content_json is not None:
        payload["contentJson"] = content_json
    if tool_name is not None:
        payload["toolName"] = tool_name
    return await backend_client.post(f"/conversations/{conversation_id}/messages", payload)


async def update_conversation(conversation_id: str, payload: dict) -> dict:
    return await backend_client.patch(f"/conversations/{conversation_id}", payload)


# ---------------------------------------------------------------------------
# Backend functions (called by executor, NOT by LLM)
# ---------------------------------------------------------------------------

async def check_availability(
    date: str,
    start_time: str,
    duration_mins: int,
    court_type: Optional[str] = None,
    booking_type: str = "regular",
    package_id: Optional[str] = None,
) -> dict:
    """Check if a court slot is available for a given date, time, and duration."""
    payload = {
        "date": date,
        "startTime": start_time,
        "durationMins": duration_mins,
        "bookingType": booking_type,
        "phone": _customer_phone.get(),
        "conversationId": _conversation_id.get(),
    }
    if court_type:
        payload["courtType"] = court_type
    if package_id:
        payload["packageId"] = package_id

    try:
        return await backend_client.post("/internal/agent/booking/check", payload)
    except Exception as e:
        return {"error": str(e)}


async def get_alternative_slots(
    date: str,
    start_time: str,
    duration_mins: int,
    court_type: Optional[str] = None,
    booking_type: str = "regular",
) -> dict:
    """Find alternative available court slots."""
    payload = {
        "date": date,
        "startTime": start_time,
        "durationMins": duration_mins,
        "bookingType": booking_type,
    }
    if court_type:
        payload["courtType"] = court_type

    try:
        return await backend_client.post("/bookings/alternatives", payload)
    except Exception as e:
        return {"error": str(e)}


async def create_booking(
    court_id: str,
    date: str,
    start_time: str,
    duration_mins: int,
    booking_type: str = "regular",
    package_id: Optional[str] = None,
    guest_count: Optional[int] = None,
    special_requests: Optional[str] = None,
) -> dict:
    """Create and confirm a court booking."""
    payload = {
        "courtId": court_id,
        "date": date,
        "startTime": start_time,
        "durationMins": duration_mins,
        "bookingType": booking_type,
        "phone": _customer_phone.get(),
        "customerId": _customer_id.get(),
        "conversationId": _conversation_id.get(),
    }
    if package_id:
        payload["packageId"] = package_id
    if guest_count:
        payload["guestCount"] = guest_count
    if special_requests:
        payload["specialRequests"] = special_requests

    try:
        return await backend_client.post("/internal/agent/booking/create", payload)
    except Exception as e:
        return {"error": str(e)}


async def modify_booking(
    booking_id: str,
    date: Optional[str] = None,
    start_time: Optional[str] = None,
    duration_mins: Optional[int] = None,
) -> dict:
    """Modify an existing booking's date, time, or duration."""
    payload: dict = {
        "bookingId": booking_id,
        "phone": _customer_phone.get(),
        "conversationId": _conversation_id.get(),
    }
    if date:
        payload["date"] = date
    if start_time:
        payload["startTime"] = start_time
    if duration_mins:
        payload["durationMins"] = duration_mins

    try:
        return await backend_client.post("/internal/agent/booking/modify", payload)
    except Exception as e:
        return {"error": str(e)}


async def cancel_booking(booking_id: str, reason: str = "") -> dict:
    """Cancel an existing booking."""
    payload = {
        "bookingId": booking_id,
        "reason": reason,
        "phone": _customer_phone.get(),
        "conversationId": _conversation_id.get(),
    }
    try:
        return await backend_client.post("/internal/agent/booking/cancel", payload)
    except Exception as e:
        return {"error": str(e)}


async def get_booking_summary(booking_id: str) -> dict:
    """Get full details of a specific booking."""
    try:
        return await backend_client.get(f"/bookings/{booking_id}/summary")
    except Exception as e:
        return {"error": str(e)}


async def update_customer(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    email: Optional[str] = None,
) -> dict:
    """Update the current customer's profile information."""
    customer_id = _customer_id.get()
    if not customer_id:
        return {"error": "No customer ID available."}

    payload: dict = {}
    if name:
        payload["name"] = name
    if phone:
        payload["phone"] = phone
    if email:
        payload["email"] = email

    if not payload:
        return {"error": "No fields to update."}

    try:
        result = await backend_client.patch(f"/customers/{customer_id}", payload)
        if phone:
            _customer_phone.set(phone)
        if isinstance(result, dict) and result.get("id"):
            _customer_id.set(result["id"])
        return result
    except Exception as e:
        return {"error": str(e)}
