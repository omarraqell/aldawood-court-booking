"""
Deterministic LangGraph agent: extract → route → execute → respond.

No ReAct loop. The LLM is called exactly twice:
  1. Extract node: structured output → intent + entities
  2. Respond node: format the response using execution results

The execute node is pure code — no LLM.
"""
import json
import logging
from datetime import datetime

from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

from app.config import settings
from app.graph.prompts.system_prompt import build_system_prompt
from app.graph.state import AgentState
from app.schemas.intent import ExtractedIntent
from app.tools.backend_tools import (
    cancel_booking,
    check_availability,
    create_booking,
    modify_booking,
    update_customer,
)

logger = logging.getLogger(__name__)

# LLMs — initialized once at module level
_llm_kwargs = {
    "api_key": settings.openai_api_key,
    "model": settings.openai_model,
    "temperature": 1,
}
if settings.openai_base_url:
    _llm_kwargs["base_url"] = settings.openai_base_url

_extractor_llm = ChatOpenAI(**_llm_kwargs).with_structured_output(ExtractedIntent)

# Response LLM: separate instance, no structured output / tools.
# Use method="json_schema" to avoid tool-call hallucination from reasoning models.
_response_llm_kwargs = {k: v for k, v in _llm_kwargs.items()}
_response_llm = ChatOpenAI(**_response_llm_kwargs)


# ---------------------------------------------------------------------------
# Extraction prompt
# ---------------------------------------------------------------------------

_EXTRACTION_PROMPT = """You are an intent and entity extractor for a football court booking system.
Analyze the customer's LATEST message and the conversation history to extract the intent and entities.

# Today: {today}

# Intents
- greet: greeting, hello, hi
- thanks: thank you, goodbye, bye
- provide_info: customer giving their name or phone (without a booking request)
- check_availability: customer wants to check or book a court (extract booking details)
- confirm_booking: customer confirming a booking, picking a court, or saying "yes/book it"
- cancel: customer wants to cancel a booking
- modify: customer wants to change a booking's date/time/duration
- ask_policy: customer asking about policies, prices, hours, or rules
- unknown: cannot determine intent

# Customer Profile
{customer_section}

# Active Bookings
{bookings_section}

# Rules
- If customer provides name/phone AND booking details together, set intent to "check_availability" and also fill customer_name/customer_phone.
- If customer picks a court ("ملعب 1", "court 2", "the first one", "1", "احجز 1"), set intent to "confirm_booking". Look through conversation history for the court UUID that matches and set court_id. Also fill date/start_time/duration_mins from the previous availability check context.
- If customer says "yes", "نعم", "تمام", "ok", "book it", "احجز", "احجزه", set intent to "confirm_booking". Look through conversation history for the court details they're confirming.
- Convert relative dates: "بكرا"/"tomorrow" = tomorrow's date, "الخميس"/"Thursday" = next Thursday, etc.
- Convert Arabic time expressions: "6 المساء" = 18:00, "الساعة 8 مساء" = 20:00.
- Default duration_mins to 60 if the customer is making a booking but didn't specify duration.
- For corrections ("قصدي", "لا", "actually", "I mean"), extract the CORRECTED value only.
- For confirm_booking: ALWAYS try to extract court_id (UUID) from the conversation history. The assistant's previous message should contain court IDs."""


# ---------------------------------------------------------------------------
# Node 1: EXTRACT — LLM Call 1
# ---------------------------------------------------------------------------

async def extract_node(state: AgentState) -> dict:
    """Extract intent and entities from the conversation using structured output."""
    customer = state.get("customer", {})
    active_bookings = state.get("active_bookings", [])
    today = datetime.now().strftime("%Y-%m-%d")

    customer_name = customer.get("name", "Unknown")
    customer_phone = customer.get("phone", "")
    customer_section = f"Name: {customer_name} | Phone: {customer_phone}"

    if active_bookings:
        lines = []
        for b in active_bookings:
            court = b.get("court", {}) if isinstance(b.get("court"), dict) else {}
            lines.append(
                f"- ID: {b.get('id', '')} | {court.get('name', '')} | "
                f"{b.get('startTime', '')} – {b.get('endTime', '')} | {b.get('status', '')}"
            )
        bookings_section = "\n".join(lines)
    else:
        bookings_section = "No active bookings."

    system = _EXTRACTION_PROMPT.format(
        today=today,
        customer_section=customer_section,
        bookings_section=bookings_section,
    )

    messages = [SystemMessage(content=system)] + list(state.get("messages", []))
    result: ExtractedIntent = await _extractor_llm.ainvoke(messages)

    logger.info(f"[EXTRACT] intent={result.intent}, data={result.model_dump(exclude_none=True)}")

    return {
        "extracted_intent": result.intent,
        "extracted_data": result.model_dump(exclude_none=True),
        "execution_result": {"action": result.intent, "results": {}, "error": None},
    }


# ---------------------------------------------------------------------------
# Node 2: ROUTE — Pure code, picks next node
# ---------------------------------------------------------------------------

def route_node(state: AgentState) -> str:
    """Route to the correct execute node based on extracted intent."""
    intent = state.get("extracted_intent", "unknown")

    if intent in ("greet", "thanks", "ask_policy", "unknown"):
        return "respond"
    elif intent == "provide_info":
        return "execute_customer"
    elif intent == "check_availability":
        return "execute_availability"
    elif intent == "confirm_booking":
        return "execute_booking"
    elif intent == "cancel":
        return "execute_cancel"
    elif intent == "modify":
        return "execute_modify"
    else:
        return "respond"


# ---------------------------------------------------------------------------
# Node 3: EXECUTE variants — Pure code, no LLM
# ---------------------------------------------------------------------------

async def execute_customer_node(state: AgentState) -> dict:
    """Update customer profile."""
    data = state.get("extracted_data", {})
    customer = state.get("customer", {})

    name = data.get("customer_name")
    phone = data.get("customer_phone")

    if not name and not phone:
        return {"execution_result": {"action": "customer_updated", "results": {}, "error": "No info provided"}}

    result = await update_customer(name=name, phone=phone)
    error = result.get("error") if isinstance(result, dict) else None

    return {"execution_result": {"action": "customer_updated", "results": result, "error": error}}


async def execute_availability_node(state: AgentState) -> dict:
    """Update customer if needed, then check availability."""
    data = state.get("extracted_data", {})
    customer = state.get("customer", {})

    # Update customer first if new info provided
    name = data.get("customer_name")
    phone = data.get("customer_phone")
    if name or phone:
        customer_name = customer.get("name", "Unknown")
        customer_phone = customer.get("phone", "")
        needs_update = (
            (name and (not customer_name or customer_name == "Unknown" or name != customer_name))
            or (phone and (not customer_phone or customer_phone.startswith("tg_") or phone != customer_phone))
        )
        if needs_update:
            await update_customer(name=name, phone=phone)

    # Check availability
    date = data.get("date")
    start_time = data.get("start_time")
    if not date or not start_time:
        missing = []
        if not date:
            missing.append("date")
        if not start_time:
            missing.append("start_time")
        return {"execution_result": {"action": "need_details", "results": {"missing": missing}, "error": None}}

    result = await check_availability(
        date=date,
        start_time=start_time,
        duration_mins=data.get("duration_mins") or 60,
        court_type=data.get("court_type"),
        booking_type=data.get("booking_type", "regular"),
        package_id=data.get("package_id"),
    )

    error = result.get("error") if isinstance(result, dict) else None
    return {"execution_result": {"action": "availability_checked", "results": result, "error": error}}


async def execute_booking_node(state: AgentState) -> dict:
    """Create a booking. Resolves court_pick to court_id by re-checking availability."""
    data = state.get("extracted_data", {})

    court_id = data.get("court_id")
    date = data.get("date")
    start_time = data.get("start_time")

    # If no court_id, resolve via availability check
    if not court_id and date and start_time:
        court_pick = (data.get("court_pick") or "").lower().strip()
        avail = await check_availability(
            date=date,
            start_time=start_time,
            duration_mins=data.get("duration_mins") or 60,
            court_type=data.get("court_type"),
            booking_type=data.get("booking_type", "regular"),
        )
        slots = avail.get("options", []) if isinstance(avail, dict) else []

        # If only one option available, auto-select it
        if len(slots) == 1:
            court_id = slots[0].get("courtId")
        elif court_pick and slots:
            pick_clean = court_pick.replace("ملعب", "").replace("court", "").replace("احجز", "").strip()

            for slot in slots:
                court_name = (slot.get("courtName", "") or "").lower()
                court_name_ar = (slot.get("courtNameAr", "") or "").lower()
                if (court_pick in court_name or court_pick in court_name_ar
                        or pick_clean in court_name or pick_clean in court_name_ar):
                    court_id = slot.get("courtId")
                    break

            # Try by index (pick "1" = first slot, "2" = second)
            if not court_id and pick_clean.isdigit():
                idx = int(pick_clean) - 1
                if 0 <= idx < len(slots):
                    court_id = slots[idx].get("courtId")

    if not court_id:
        court_pick = data.get("court_pick", "")
        return {
            "execution_result": {
                "action": "need_court_id",
                "results": {"court_pick": court_pick},
                "error": None,
            }
        }

    if not date or not start_time:
        missing = []
        if not date:
            missing.append("date")
        if not start_time:
            missing.append("start_time")
        return {"execution_result": {"action": "need_details", "results": {"missing": missing}, "error": None}}

    result = await create_booking(
        court_id=court_id,
        date=date,
        start_time=start_time,
        duration_mins=data.get("duration_mins") or 60,
        booking_type=data.get("booking_type", "regular"),
        package_id=data.get("package_id"),
        guest_count=data.get("guest_count"),
        special_requests=data.get("special_requests"),
    )

    error = result.get("error") if isinstance(result, dict) else None
    return {"execution_result": {"action": "booking_created", "results": result, "error": error}}


async def execute_cancel_node(state: AgentState) -> dict:
    """Cancel a booking."""
    data = state.get("extracted_data", {})
    active_bookings = state.get("active_bookings", [])

    booking_id = data.get("booking_id")
    if not booking_id:
        if len(active_bookings) == 1:
            booking_id = active_bookings[0].get("id", "")
        else:
            return {
                "execution_result": {
                    "action": "need_booking_id",
                    "results": {"active_bookings": active_bookings},
                    "error": None,
                }
            }

    result = await cancel_booking(booking_id=booking_id, reason=data.get("cancel_reason", ""))
    error = result.get("error") if isinstance(result, dict) else None
    return {"execution_result": {"action": "booking_cancelled", "results": result, "error": error}}


async def execute_modify_node(state: AgentState) -> dict:
    """Modify a booking."""
    data = state.get("extracted_data", {})
    active_bookings = state.get("active_bookings", [])

    booking_id = data.get("booking_id")
    if not booking_id:
        if len(active_bookings) == 1:
            booking_id = active_bookings[0].get("id", "")
        else:
            return {
                "execution_result": {
                    "action": "need_booking_id",
                    "results": {"active_bookings": active_bookings},
                    "error": None,
                }
            }

    result = await modify_booking(
        booking_id=booking_id,
        date=data.get("date"),
        start_time=data.get("start_time"),
        duration_mins=data.get("duration_mins"),
    )
    error = result.get("error") if isinstance(result, dict) else None
    return {"execution_result": {"action": "booking_modified", "results": result, "error": error}}


# ---------------------------------------------------------------------------
# Node 4: RESPOND — LLM Call 2
# ---------------------------------------------------------------------------

async def respond_node(state: AgentState) -> dict:
    """Generate a natural language response using execution results."""
    system_prompt = build_system_prompt(
        policies=state.get("policies", {}),
        packages=state.get("packages", []),
        active_bookings=state.get("active_bookings", []),
        customer=state.get("customer", {}),
    )

    execution_result = state.get("execution_result", {})
    intent = state.get("extracted_intent", "unknown")
    action = execution_result.get("action", intent)
    results = execution_result.get("results", {})
    error = execution_result.get("error")

    execution_context = _format_execution_context(action, results, error)

    full_system = f"""{system_prompt}

# What Just Happened (use this to form your response)
{execution_context}

# Response Rules
- CRITICAL: Your response MUST match the action above. NEVER say a booking was created unless action is "booking_created". NEVER confirm a cancellation unless action is "booking_cancelled".
- Use the results above to form your response. Do NOT make up data.
- If action is "need_details", ask for the missing fields naturally.
- If action is "need_court_id", ask the customer to pick a court from the options shown earlier.
- If action is "availability_checked", present the available slots clearly with court names and prices.
- If action is "booking_created", confirm the booking with details from the results.
- If action is "booking_cancelled" or "booking_modified", confirm the change with details from results.
- If intent is "greet" or "thanks", respond warmly.
- If intent is "ask_policy", answer from the policies in your system prompt.
- If there's an error, explain it simply and suggest what to do.
- Do NOT mention tools, intents, UUIDs, or technical details.
- Do NOT call any functions or tools. You are a text-only responder. Just produce a plain text reply.
- Keep responses concise and friendly."""

    messages = [SystemMessage(content=full_system)] + list(state.get("messages", []))
    response = await _response_llm.ainvoke(messages)

    logger.info(f"[RESPOND] generated reply, length={len(response.content)}")
    return {
        "execution_result": {
            **execution_result,
            "reply": response.content,
        },
    }


def _format_execution_context(action: str, results: dict, error: str | None) -> str:
    """Format execution results for the response LLM."""
    if error:
        return f"Action: {action}\nError: {error}\nResults: {json.dumps(results, ensure_ascii=False, default=str)}"

    if action in ("greet", "thanks"):
        return f"Action: {action}. Respond naturally."

    if action == "customer_updated":
        return "Action: Customer profile updated successfully. Acknowledge and ask how to help."

    if action == "need_details":
        missing = results.get("missing", [])
        return f"Action: Missing booking details. Ask customer for: {', '.join(missing)}"

    if action == "need_court_id":
        return f"Action: Customer picked '{results.get('court_pick', '')}' but court UUID not resolved. Ask them to confirm from the options shown earlier."

    if action == "need_booking_id":
        return f"Action: Customer wants to modify/cancel but has multiple bookings. List them and ask which one.\nBookings: {json.dumps(results.get('active_bookings', []), ensure_ascii=False, default=str)}"

    return f"Action: {action}\nResults: {json.dumps(results, ensure_ascii=False, default=str)}"


# ---------------------------------------------------------------------------
# Build the graph
# ---------------------------------------------------------------------------

def _build_graph() -> StateGraph:
    g = StateGraph(AgentState)

    # Add nodes
    g.add_node("extract", extract_node)
    g.add_node("execute_customer", execute_customer_node)
    g.add_node("execute_availability", execute_availability_node)
    g.add_node("execute_booking", execute_booking_node)
    g.add_node("execute_cancel", execute_cancel_node)
    g.add_node("execute_modify", execute_modify_node)
    g.add_node("respond", respond_node)

    # Entry point
    g.set_entry_point("extract")

    # Conditional routing after extract
    g.add_conditional_edges("extract", route_node)

    # All execute nodes go to respond
    g.add_edge("execute_customer", "respond")
    g.add_edge("execute_availability", "respond")
    g.add_edge("execute_booking", "respond")
    g.add_edge("execute_cancel", "respond")
    g.add_edge("execute_modify", "respond")

    # Respond is the end
    g.add_edge("respond", END)

    return g.compile()


graph = _build_graph()
