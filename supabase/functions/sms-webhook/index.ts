import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Twilio sends application/x-www-form-urlencoded
  const formData = await req.formData();
  const from = formData.get("From") as string | null;
  const body = formData.get("Body") as string | null;
  const messageSid = formData.get("MessageSid") as string | null;

  if (!from || !body) {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  // Normalize phone for matching (strip spaces, keep + prefix)
  const normalized = from.replace(/\s+/g, "");

  // Try to match sender phone to an existing contact
  let contactId: number | null = null;

  const { data: contacts } = await supabaseAdmin
    .from("contacts")
    .select("id, phone_jsonb")
    .limit(500);

  if (contacts) {
    for (const c of contacts) {
      const phones = c.phone_jsonb ?? [];
      for (const p of phones) {
        const pNorm = (p.number ?? "").replace(/\s+/g, "");
        if (pNorm === normalized || pNorm === normalized.replace(/^\+/, "")) {
          contactId = c.id;
          break;
        }
      }
      if (contactId) break;
    }
  }

  // Log inbound SMS to communication_log
  await supabaseAdmin.from("communication_log").insert({
    contact_id: contactId,
    channel: "sms",
    direction: "inbound",
    content_summary: body.substring(0, 500),
    external_id: messageSid,
    metadata: { from, twilio_sid: messageSid },
  });

  // Return TwiML empty response (no auto-reply)
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { "Content-Type": "text/xml" } },
  );
});
