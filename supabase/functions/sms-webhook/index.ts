import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createErrorResponse } from "../_shared/utils.ts";
import { logCommunication } from "../_shared/communicationLog.ts";
import { findContactByPhone } from "../_shared/contactUtils.ts";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return createErrorResponse(405, "Method Not Allowed");
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

  // Match sender phone to an existing contact
  const contactId = await findContactByPhone(from);

  await logCommunication({
    contact_id: contactId,
    channel: "sms",
    direction: "inbound",
    content_summary: body.substring(0, 500),
    external_id: messageSid ?? undefined,
    metadata: { from, twilio_sid: messageSid },
  });

  // Return TwiML empty response (no auto-reply)
  return new Response(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { "Content-Type": "text/xml" } },
  );
});
