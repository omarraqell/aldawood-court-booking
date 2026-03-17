from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def to_local_parts(iso_value: str | None, time_zone: str = "Asia/Amman") -> tuple[str, str]:
    if not iso_value:
        return "", ""

    normalized = iso_value.replace("Z", "+00:00")
    parsed = datetime.fromisoformat(normalized)
    try:
        localized = parsed.astimezone(ZoneInfo(time_zone))
    except ZoneInfoNotFoundError:
        localized = parsed.astimezone(timezone(timedelta(hours=3)))
    return localized.strftime("%Y-%m-%d"), localized.strftime("%H:%M")
