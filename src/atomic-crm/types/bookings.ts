import type { Identifier, RaRecord } from "ra-core";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type Booking = {
  conversation_id?: Identifier;
  contact_id?: Identifier;
  sales_id?: Identifier;
  calcom_event_id?: string;
  scheduled_at?: string;
  status: BookingStatus;
  created_at: string;
} & Pick<RaRecord, "id">;
