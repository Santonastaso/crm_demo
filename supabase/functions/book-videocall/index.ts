import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createErrorResponse, createJsonResponse } from "../_shared/utils.ts";
import { requirePost } from "../_shared/requestHandler.ts";
import { getContactById, contactFullName, primaryEmail } from "../_shared/contactUtils.ts";
import { DEFAULT_EVENT_TYPE_ID, SLOTS_LOOKAHEAD_DAYS } from "../_shared/constants.ts";
import { parseJsonBody } from "../_shared/parseJsonBody.ts";

interface BookVideocallBody {
  action?: string;
  contact_id?: number;
  conversation_id?: number;
  sales_id?: number;
  date?: string;
  preferred_time?: string;
  event_type_id?: number;
  name?: string;
  email?: string;
  notes?: string;
}

Deno.serve(async (req: Request) => {
  const earlyResponse = requirePost(req);
  if (earlyResponse) return earlyResponse;

  const calcomApiKey = Deno.env.get("CALCOM_API_KEY");
  const calcomBaseUrl =
    Deno.env.get("CALCOM_BASE_URL") ?? "https://api.cal.com/v1";

  if (!calcomApiKey) {
    return createErrorResponse(500, "Cal.com API key not configured");
  }

  const parsed = await parseJsonBody<BookVideocallBody>(req);
  if (!parsed.ok) return parsed.response;
  const {
    action,
    contact_id,
    conversation_id,
    sales_id,
    date,
    preferred_time,
    event_type_id,
    name,
    email,
    notes,
  } = parsed.data;

  // Resolve contact name/email from DB if contact_id provided
  let contactName = name ?? "Prospect";
  let contactEmail = email ?? "";

  if (contact_id && (!name || !email)) {
    const contact = await getContactById(contact_id);
    if (contact) {
      contactName = contactFullName(contact);
      if (!contactEmail) {
        contactEmail = primaryEmail(contact) ?? "";
      }
    }
  }

  // Fallback email if still empty
  if (!contactEmail) {
    contactEmail = "booking@crm-generated.local";
  }

  // Action: "slots" — return available slots
  if (action === "slots" || !date) {
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + SLOTS_LOOKAHEAD_DAYS * 86400000)
      .toISOString()
      .split("T")[0];

    const slotsUrl = `${calcomBaseUrl}/slots?apiKey=${calcomApiKey}&startTime=${startDate}T00:00:00.000Z&endTime=${endDate}T23:59:59.000Z&eventTypeId=${event_type_id ?? DEFAULT_EVENT_TYPE_ID}`;

    const slotsResponse = await fetch(slotsUrl);
    const slotsData = await slotsResponse.json();

    // Flatten slots into a simple array
    const allSlots: Array<{ date: string; time: string }> = [];
    const slotsMap = slotsData.slots ?? {};

    for (const [dateKey, timeslots] of Object.entries(slotsMap)) {
      for (const slot of timeslots as Array<{ time: string }>) {
        allSlots.push({
          date: dateKey,
          time: slot.time ?? String(slot),
        });
      }
    }

    return createJsonResponse({ slots: allSlots.slice(0, 20) });
  }

  // Action: "book" — create a booking
  // preferred_time can be HH:MM or a full ISO timestamp
  let startTime: string;
  if (preferred_time && preferred_time.includes("T")) {
    startTime = preferred_time; // already a full ISO string
  } else if (preferred_time) {
    startTime = `${date}T${preferred_time}:00.000Z`;
  } else {
    startTime = `${date}T10:00:00.000Z`;
  }

  const bookingPayload = {
    eventTypeId: event_type_id ?? DEFAULT_EVENT_TYPE_ID,
    start: startTime,
    language: Deno.env.get("CALCOM_LANGUAGE") ?? "it",
    responses: {
      name: contactName,
      email: contactEmail,
      notes: notes || `CRM booking for ${contactName}`,
    },
    metadata: {
      contact_id: String(contact_id ?? ""),
      conversation_id: String(conversation_id ?? ""),
    },
    timeZone: Deno.env.get("CALCOM_TIMEZONE") ?? "Europe/Rome",
  };

  const bookingResponse = await fetch(
    `${calcomBaseUrl}/bookings?apiKey=${calcomApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingPayload),
    },
  );

  const bookingResult = await bookingResponse.json();

  if (!bookingResponse.ok) {
    console.error("Cal.com booking error:", bookingResult);
    return createErrorResponse(
      500,
      `Failed to create booking: ${bookingResult.message ?? "unknown error"}`,
    );
  }

  // Save booking record in DB
  const { data: booking } = await supabaseAdmin
    .from("bookings")
    .insert({
      conversation_id: conversation_id ?? null,
      contact_id: contact_id ?? null,
      sales_id: sales_id ?? null,
      calcom_event_id: String(bookingResult.id ?? bookingResult.uid),
      scheduled_at: startTime,
      status: "confirmed",
    })
    .select("*")
    .single();

  return createJsonResponse({
    booking_id: booking?.id,
    calcom_event_id: bookingResult.id ?? bookingResult.uid,
    scheduled_at: startTime,
    status: "confirmed",
  });
});
