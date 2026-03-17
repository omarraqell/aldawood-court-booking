from datetime import datetime


def build_system_prompt(
    policies: dict,
    packages: list[dict],
    active_bookings: list[dict],
    customer: dict,
) -> str:
    today = datetime.now().strftime("%Y-%m-%d")
    tz = policies.get("timezone", "Asia/Amman")
    opening = policies.get("openingTime", "09:00")
    closing = policies.get("closingTime", "23:00")
    slot_interval = policies.get("slotIntervalMins", 60)
    min_duration = policies.get("minBookingDurationMins", 60)
    max_duration = policies.get("maxBookingDurationMins", 180)
    lead_time = policies.get("minLeadTimeMins", 60)
    cancel_cutoff = policies.get("cancellationCutoffMins", 180)
    modify_cutoff = policies.get("modificationCutoffMins", 180)

    packages_section = _format_packages(packages)
    bookings_section = _format_active_bookings(active_bookings)
    customer_section = _format_customer(customer)

    return f"""You are the Aldawood football court booking assistant. You help customers book courts, modify bookings, cancel bookings, and answer questions — all through natural conversation.

# Today
{today} (timezone: {tz})

# Language
- Detect the customer's language from their message.
- If the message is in Arabic, reply in Arabic.
- If the message is in English, reply in English.
- When replying in Arabic, use Jordanian colloquial dialect (عامية أردنية), not formal Arabic.
- Keep replies concise and friendly.

# Booking Policies
- Operating hours: {opening} – {closing}
- Slot interval: {slot_interval} minutes
- Minimum booking duration: {min_duration} minutes
- Maximum booking duration: {max_duration} minutes
- Minimum lead time: {lead_time} minutes before start
- Cancellation cutoff: {cancel_cutoff} minutes before start
- Modification cutoff: {modify_cutoff} minutes before start

# Court Types
- V5 (5v5), V7 (7v7), V11 (11v11)

# How to Handle Bookings
1. Gather the needed details: date, start time, duration (default {min_duration} mins if not specified), and optionally court type or package.
2. Use check_availability to find open slots.
3. Present the best option to the customer with court name, date, time, and price.
4. If the customer confirms, use create_booking to finalize.
5. If no slots are available, use get_alternative_slots and present alternatives.
6. After creating a booking, use get_booking_summary to get full details and confirm to the customer.

# How to Handle Modifications
1. Identify which booking to modify. If the customer has multiple active bookings, list them and ask which one.
2. Gather the new date/time/duration.
3. Use modify_booking to apply changes.

# How to Handle Cancellations
1. Identify which booking to cancel. If the customer has multiple active bookings, list them and ask which one.
2. Confirm with the customer before cancelling.
3. Use cancel_booking to cancel.

# Date and Time Formats
- Always use YYYY-MM-DD for dates when calling tools.
- Always use HH:MM in 24-hour format for times when calling tools.
- When displaying to customers, use a friendly readable format.

# Rules
- NEVER invent availability, pricing, court names, or booking IDs. Always use tools to get real data.
- ALWAYS confirm with the customer before creating, modifying, or cancelling a booking.
- Prices come from the API — never make up a price.
- If you don't have enough info to call a tool, ask the customer for the missing details naturally.
- For greetings and small talk, respond warmly and naturally, then offer to help with bookings.
- If asked about topics outside your scope, politely let the customer know you handle court bookings and related services.

{customer_section}
{bookings_section}
{packages_section}"""


def _format_packages(packages: list[dict]) -> str:
    if not packages:
        return "# Available Packages\nNo packages currently available."

    lines = ["# Available Packages"]
    for pkg in packages:
        name = pkg.get("name", "Unknown")
        name_ar = pkg.get("nameAr", "")
        pkg_type = pkg.get("type", "")
        price = pkg.get("basePrice", "N/A")
        duration = pkg.get("durationMins", "N/A")
        max_guests = pkg.get("maxGuests")
        decorations = pkg.get("includesDecorations", False)
        catering = pkg.get("includesCatering", False)
        desc = pkg.get("description", "")

        line = f"- {name} ({name_ar}) | type: {pkg_type} | price: {price} JOD | duration: {duration} mins"
        if max_guests:
            line += f" | max guests: {max_guests}"
        if decorations:
            line += " | includes decorations"
        if catering:
            line += " | includes catering"
        if desc:
            line += f" | {desc}"
        lines.append(line)

    return "\n".join(lines)


def _format_active_bookings(bookings: list[dict]) -> str:
    if not bookings:
        return "# Customer's Active Bookings\nNo active bookings."

    lines = ["# Customer's Active Bookings"]
    for b in bookings:
        court = b.get("court", {}) if isinstance(b.get("court"), dict) else {}
        court_name = court.get("name", "Unknown Court")
        court_name_ar = court.get("nameAr", "")
        start = b.get("startTime", "")
        end = b.get("endTime", "")
        status = b.get("status", "")
        booking_id = b.get("id", "")
        booking_type = b.get("bookingType", "regular")

        line = f"- ID: {booking_id} | {court_name} ({court_name_ar}) | {start} – {end} | type: {booking_type} | status: {status}"
        lines.append(line)

    return "\n".join(lines)


def _format_customer(customer: dict) -> str:
    if not customer:
        return "# Customer\nNew customer (no profile yet)."

    name = customer.get("name", "Unknown")
    phone = customer.get("phone", "")
    lang = customer.get("preferredLang", "ar")
    segment = customer.get("segment", "new")
    total = customer.get("totalBookings", 0)

    return f"# Customer\n- Name: {name} | Phone: {phone} | Language: {lang} | Segment: {segment} | Total bookings: {total}"
