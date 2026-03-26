"""Pydantic models for the extraction LLM output."""
from typing import Optional

from pydantic import BaseModel, Field


class ExtractedIntent(BaseModel):
    """Structured output from the extraction LLM call."""

    intent: str = Field(
        description=(
            "The customer's primary intent. One of: "
            "greet, thanks, provide_info, check_availability, "
            "confirm_booking, cancel, modify, ask_policy, unknown"
        )
    )

    # Customer info
    customer_name: Optional[str] = Field(None, description="Customer's full name if provided")
    customer_phone: Optional[str] = Field(
        None,
        description="Customer's real phone number if provided (e.g. 0791234567, +962791234567)",
    )

    # Booking details
    date: Optional[str] = Field(None, description="Booking date in YYYY-MM-DD format")
    start_time: Optional[str] = Field(None, description="Start time in HH:MM 24-hour format")
    duration_mins: Optional[int] = Field(
        None, description="Duration in minutes (default 60 if not specified)"
    )
    court_type: Optional[str] = Field(None, description="Court size: V5, V7, or V11")
    court_id: Optional[str] = Field(
        None, description="Exact court UUID from previous availability results in conversation history"
    )
    court_pick: Optional[str] = Field(
        None,
        description="Court selection like 'court 1', 'ملعب 2', 'the cheapest' — when customer picks from options",
    )

    # Modification/cancellation
    booking_id: Optional[str] = Field(None, description="UUID of booking to modify or cancel")

    # Event details
    booking_type: str = Field("regular", description="One of: regular, birthday, private_event")
    package_id: Optional[str] = Field(None, description="Event package UUID if mentioned")
    guest_count: Optional[int] = Field(None, description="Number of guests for events")
    special_requests: Optional[str] = Field(None, description="Any special requests from the customer")

    # Cancellation
    cancel_reason: Optional[str] = Field(None, description="Reason for cancellation if provided")

    # Freeform question
    question: Optional[str] = Field(
        None, description="Customer's question about policies, prices, or hours"
    )
