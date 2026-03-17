export type BookingIntent = "booking" | "modification" | "cancellation" | "inquiry";

export interface AvailabilityRequest {
  date: string;
  startTime: string;
  durationMins: number;
  courtType?: "V5" | "V7" | "V11";
  bookingType?: "regular" | "birthday" | "private_event";
}

export interface AlternativeSlot {
  courtId: string;
  courtName: string;
  startTime: string;
  endTime: string;
  price: string;
}

export interface AgentReply {
  conversationId: string;
  message: string;
  state: string;
}

