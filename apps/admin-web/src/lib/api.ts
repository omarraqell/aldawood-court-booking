const apiBaseUrl = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:4000/api";

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";
export type BookingType = "regular" | "birthday" | "private_event";
export type ConversationStatus =
  | "active"
  | "waiting_customer"
  | "waiting_system"
  | "completed"
  | "abandoned";
export type Intent =
  | "booking"
  | "cancellation"
  | "inquiry"
  | "event"
  | "modification"
  | "general_inquiry"
  | null;
export type Channel = "web_test" | "whatsapp" | "voice";
export type CourtType = "V5" | "V7" | "V11";
export type EventType = "birthday" | "corporate" | "tournament" | "private_event";

export type Customer = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  preferredLang: "ar" | "en";
  segment: "new" | "occasional" | "regular" | "vip";
  totalBookings: number;
  totalSpent: string;
  createdAt: string;
  updatedAt: string;
};

export type EventExtra = {
  id: string;
  bookingId: string;
  packageId: string | null;
  eventType: EventType;
  guestCount: number | null;
  decorations: boolean;
  catering: boolean;
  specialRequests: string | null;
  packageName: string | null;
  packagePrice: string | null;
  createdAt: string;
};

export type PricingRule = {
  id: string;
  courtId: string | null;
  name: string;
  priority: number;
  dayOfWeek: number | null;
  startHour: number;
  endHour: number;
  price: string;
  isPeak: boolean;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
};

export type CourtBlock = {
  id: string;
  courtId: string;
  createdByAdminId: string | null;
  reason: string;
  startTime: string;
  endTime: string;
  createdAt: string;
};

export type Court = {
  id: string;
  name: string;
  nameAr: string;
  type: CourtType;
  surface: "artificial_grass" | "natural_grass";
  capacity: number;
  hourlyRate: string;
  peakRate: string;
  mapsLink: string | null;
  isActive: boolean;
  pricingRules?: PricingRule[];
  blocks?: CourtBlock[];
};

export type Booking = {
  id: string;
  customerId: string;
  courtId: string;
  createdByConversationId: string | null;
  bookingType: BookingType;
  source: "admin" | "agent" | "web_test" | "whatsapp";
  status: BookingStatus;
  startTime: string;
  endTime: string;
  durationMins: number;
  price: string;
  discount: string;
  cancelReason: string | null;
  cancelledAt: string | null;
  confirmedAt: string | null;
  cancelToken: string | null;
  modifyToken: string | null;
  customer: Customer | null;
  court: Court | null;
  eventExtras: EventExtra | null;
  conversation?: Conversation | null;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  contentJson: unknown;
  toolName: string | null;
  createdAt: string;
};

export type Conversation = {
  id: string;
  customerId: string | null;
  channel: Channel;
  status: ConversationStatus;
  intent: Intent;
  summary: string | null;
  resolved: boolean;
  startedAt: string;
  lastMessageAt: string | null;
  endedAt: string | null;
  customer: Customer | null;
  booking?: Booking[];
  messages?: ConversationMessage[];
};

export type BookingListResponse = {
  items: Booking[];
  pagination: PaginationMeta;
};

export type ConversationListResponse = {
  items: Conversation[];
};

export type CourtListResponse = {
  items: Court[];
};

export type EventPackage = {
  id: string;
  name: string;
  nameAr: string;
  type: EventType;
  description: string | null;
  descriptionAr: string | null;
  basePrice: string;
  maxGuests: number | null;
  includesDecorations: boolean;
  includesCatering: boolean;
  durationMins: number;
  isActive: boolean;
  createdAt: string;
};

export type EventPackageListResponse = {
  items: EventPackage[];
};

export type Policy = {
  id: string;
  timezone: string;
  slotIntervalMins: number;
  minBookingDurationMins: number;
  maxBookingDurationMins: number;
  minLeadTimeMins: number;
  cancellationCutoffMins: number;
  modificationCutoffMins: number;
  openingTime: string;
  closingTime: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "manager" | "staff";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminListResponse = {
  items: AdminUser[];
};

export type AuditLog = {
  id: string;
  actorType: "admin" | "agent" | "system";
  actorId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson: unknown;
  afterJson: unknown;
  createdAt: string;
};

export type AuditLogListResponse = {
  items: AuditLog[];
};

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function apiSafeGet<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiGet<T>(path);
  } catch {
    return fallback;
  }
}

export function getBookings(params: { page?: number; limit?: number; courtId?: string; date?: string } = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());
  if (params.courtId) query.set("courtId", params.courtId);
  if (params.date) query.set("date", params.date);

  const queryString = query.toString();
  const path = `/bookings${queryString ? `?${queryString}` : ""}`;

  return apiSafeGet<BookingListResponse>(path, {
    items: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
  });
}

export function getBooking(id: string) {
  return apiSafeGet<Booking | null>(`/bookings/${id}`, null);
}

export function getConversations() {
  return apiSafeGet<ConversationListResponse>("/conversations", {
    items: []
  });
}

export function getConversation(id: string) {
  return apiSafeGet<Conversation | null>(`/conversations/${id}`, null);
}

export function getCourts() {
  return apiSafeGet<CourtListResponse>("/courts", {
    items: []
  });
}

export function getCourt(id: string) {
  return apiSafeGet<Court | null>(`/courts/${id}`, null);
}

export function getPolicies() {
  return apiSafeGet<Policy | null>("/policies", null);
}

export function getEventPackages() {
  return apiSafeGet<EventPackageListResponse>("/event-packages", {
    items: []
  });
}

export function getAdmins() {
  return apiSafeGet<AdminListResponse>("/admins", {
    items: []
  });
}

export function getAuditLogs() {
  return apiSafeGet<AuditLogListResponse>("/audit-logs", {
    items: []
  });
}
