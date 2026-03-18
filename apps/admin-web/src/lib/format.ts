import type {
  Booking,
  BookingStatus,
  BookingType,
  Channel,
  ConversationStatus,
  Court,
  EventPackage,
  Intent
} from "@/lib/api";

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Amman"
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Asia/Amman"
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Amman"
});

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "Unavailable";
  return dateTimeFormatter.format(new Date(value));
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "Unavailable";
  return dateFormatter.format(new Date(value));
}

export function formatTime(value: string | Date | null | undefined) {
  if (!value) return "Unavailable";
  return timeFormatter.format(new Date(value));
}

export function formatCurrency(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "Unavailable";
  const numeric = typeof value === "number" ? value : Number(value);
  return `${numeric.toFixed(0)} JOD`;
}

export function bookingTypeLabel(type: BookingType) {
  switch (type) {
    case "birthday":
      return "Birthday";
    case "private_event":
      return "Private Event";
    default:
      return "Regular";
  }
}

export function bookingStatusLabel(status: BookingStatus) {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    case "no_show":
      return "No Show";
  }
}

export function conversationStatusLabel(status: ConversationStatus) {
  switch (status) {
    case "waiting_customer":
      return "Waiting Customer";
    case "waiting_system":
      return "Waiting System";
    default:
      return capitalize(status);
  }
}

export function intentLabel(intent: Intent) {
  if (!intent) return "Unclassified";
  if (intent === "general_inquiry") return "General Inquiry";
  return capitalize(intent.replace("_", " "));
}

export function channelLabel(channel: Channel) {
  if (channel === "web_test") return "Web Test";
  return capitalize(channel);
}

export function surfaceLabel(surface: Court["surface"]) {
  return surface === "artificial_grass" ? "Artificial Grass" : "Natural Grass";
}

export function packageTypeLabel(pkg: EventPackage["type"]) {
  if (pkg === "private_event") return "Private Event";
  return capitalize(pkg);
}

export function badgeTone(
  kind:
    | BookingStatus
    | ConversationStatus
    | BookingType
    | "web_test"
    | "whatsapp"
    | "voice"
    | "birthday"
    | "private_event"
    | "corporate"
    | "tournament"
) {
  if (kind === "confirmed" || kind === "completed" || kind === "birthday") return "success";
  if (kind === "cancelled" || kind === "abandoned") return "danger";
  if (kind === "waiting_customer" || kind === "waiting_system" || kind === "private_event") {
    return "warning";
  }
  if (kind === "corporate" || kind === "tournament" || kind === "voice") return "accent";
  return "neutral";
}

export function describeBooking(booking: Booking) {
  return `${booking.court?.name ?? "Unknown court"} · ${formatDateTime(booking.startTime)}`;
}

function capitalize(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
