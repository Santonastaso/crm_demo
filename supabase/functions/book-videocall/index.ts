import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, createErrorResponse } from "../_shared/utils.ts";
import { requirePost } from "../_shared/requestHandler.ts";

Deno.serve(async (req: Request) => {
  const earlyResponse = requirePost(req);
  if (earlyResponse) return earlyResponse;

  const calcomApiKey = Deno.env.get("CALCOM_API_KEY");
  const calcomBaseUrl =
    Deno.env.get("CALCOM_BASE_URL") ?? "https://api.cal.com/v1";

  if (!calcomApiKey) {
    return createErrorResponse(500, "Cal.com API key not configured");
  }

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
  } = await req.json();

  // Resolve contact name/email from DB if contact_id provided
  let contactName = name ?? "Prospect";
  let contactEmail = email ?? "";

  if (contact_id && (!name || !email)) {
    const { data: contact } = await supabaseAdmin
      .from("contacts")
      .select("first_name, last_name, email_jsonb")
      .eq("id", contact_id)
      .single();

    if (contact) {
      contactName =
        `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() ||
        "Prospect";
      if (!contactEmail) {
        const emails: Array<{ email: string }> = contact.email_jsonb ?? [];
        contactEmail = emails[0]?.email ?? "";
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
    const endDate = new Date(Date.now() + 7 * 86400000)
      .toISOString()
      .split("T")[0];

    const slotsUrl = `${calcomBaseUrl}/slots?apiKey=${calcomApiKey}&startTime=${startDate}T00:00:00.000Z&endTime=${endDate}T23:59:59.000Z&eventTypeId=${event_type_id ?? 1}`;

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

    return new Response(
      JSON.stringify({ slots: allSlots.slice(0, 20) }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }

  // Action: "book" — create a booking
  const startTime = preferred_time
    ? `${date}T${preferred_time}:00.000Z`
    : `${date}T10:00:00.000Z`;

  const bookingPayload = {
    eventTypeId: event_type_id ?? 1,
    start: startTime,
    responses: {
      name: contactName,
      email: contactEmail,
    },
    metadata: {
      contact_id: contact_id ?? null,
      conversation_id: conversation_id ?? null,
    },
    timeZone: "Europe/Rome",
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

  return new Response(
    JSON.stringify({
      booking_id: booking?.id,
      calcom_event_id: bookingResult.id ?? bookingResult.uid,
      scheduled_at: startTime,
      status: "confirmed",
    }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
