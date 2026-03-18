from contextvars import ContextVar
from typing import Optional

from langchain_core.tools import tool

from app.clients.backend_client import backend_client

# Context vars set before the ReAct loop runs — tools read these
_conversation_id: ContextVar[str] = ContextVar("conversation_id", default="")
_customer_id: ContextVar[str] = ContextVar("customer_id", default="")
_customer_phone: ContextVar[str] = ContextVar("customer_phone", default="")


def set_tool_context(conversation_id: str, customer_id: str, customer_phone: str) -> None:
    _conversation_id.set(conversation_id)
    _customer_id.set(customer_id)
    _customer_phone.set(customer_phone)


# ---------------------------------------------------------------------------
# Infrastructure helpers (NOT exposed to the LLM)
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
# LLM-callable tools
# ---------------------------------------------------------------------------

@tool
async def check_availability(
    date: str,
    start_time: str,
    duration_mins: int,
    court_type: Optional[str] = None,
    booking_type: str = "regular",
    package_id: Optional[str] = None,
) -> dict:
    """Check if a court slot is available for a given date, time, and duration.

    Args:
        date: Date in YYYY-MM-DD format.
        start_time: Start time in HH:MM 24-hour format.
        duration_mins: Duration in minutes.
        court_type: Optional court size filter — one of V5, V7, V11.
        booking_type: One of regular, birthday, private_event.
        package_id: Optional event package ID.

    Returns available slots with courtId, courtName, startTime, price, etc.
    """
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


@tool
async def get_alternative_slots(
    date: str,
    start_time: str,
    duration_mins: int,
    court_type: Optional[str] = None,
    booking_type: str = "regular",
) -> dict:
    """Find alternative available court slots when the requested time is not available.

    Args:
        date: Date in YYYY-MM-DD format.
        start_time: Start time in HH:MM 24-hour format.
        duration_mins: Duration in minutes.
        court_type: Optional court size filter — one of V5, V7, V11.
        booking_type: One of regular, birthday, private_event.
    """
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


@tool
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
    """Create and confirm a court booking.

    Only call this AFTER the customer has explicitly confirmed they want to book.

    Args:
        court_id: UUID of the court to book.
        date: Date in YYYY-MM-DD format.
        start_time: Start time in HH:MM 24-hour format.
        duration_mins: Duration in minutes.
        booking_type: One of regular, birthday, private_event.
        package_id: Optional event package UUID.
        guest_count: Optional number of guests (for events).
        special_requests: Optional special requests text.
    """
    payload = {
        "courtId": court_id,
        "date": date,
        "startTime": start_time,
        "durationMins": duration_mins,
        "bookingType": booking_type,
        "phone": _customer_phone.get(),
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


@tool
async def modify_booking(
    booking_id: str,
    date: Optional[str] = None,
    start_time: Optional[str] = None,
    duration_mins: Optional[int] = None,
) -> dict:
    """Modify an existing booking's date, time, or duration.

    Only call this AFTER the customer has confirmed the modification.

    Args:
        booking_id: UUID of the booking to modify.
        date: New date in YYYY-MM-DD format (optional).
        start_time: New start time in HH:MM format (optional).
        duration_mins: New duration in minutes (optional).
    """
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


@tool
async def cancel_booking(booking_id: str, reason: str = "") -> dict:
    """Cancel an existing booking.

    Only call this AFTER the customer has explicitly confirmed they want to cancel.

    Args:
        booking_id: UUID of the booking to cancel.
        reason: Reason for cancellation.
    """
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


@tool
async def get_booking_summary(booking_id: str) -> dict:
    """Get full details of a specific booking including court name, time, price, and status.

    Args:
        booking_id: UUID of the booking.
    """
    try:
        return await backend_client.get(f"/bookings/{booking_id}/summary")
    except Exception as e:
        return {"error": str(e)}


# List of tools to give the LLM
agent_tools = [
    check_availability,
    get_alternative_slots,
    create_booking,
    modify_booking,
    cancel_booking,
    get_booking_summary,
]
