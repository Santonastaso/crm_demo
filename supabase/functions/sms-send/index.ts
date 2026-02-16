import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, createErrorResponse, createJsonResponse } from "../_shared/utils.ts";
import { logCommunication } from "../_shared/communicationLog.ts";
import { requirePost } from "../_shared/requestHandler.ts";

Deno.serve(async (req: Request) => {
  const earlyResponse = requirePost(req);
  if (earlyResponse) return earlyResponse;

  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const twilioAuth = Deno.env.get("TWILIO_AUTH_TOKEN");
  const twilioFrom = Deno.env.get("TWILIO_FROM_NUMBER");

  if (!twilioSid || !twilioAuth || !twilioFrom) {
    return createErrorResponse(500, "Twilio credentials not configured");
  }

  const { to, message, contact_id, project_id } = await req.json();

  if (!to || !message) {
    return createErrorResponse(400, "to and message are required");
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  const authHeader = btoa(`${twilioSid}:${twilioAuth}`);

  const formData = new URLSearchParams();
  formData.append("To", to);
  formData.append("From", twilioFrom);
  formData.append("Body", message);

  const response = await fetch(twilioUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("Twilio API error:", result);
    return createErrorResponse(
      response.status,
      result.message ?? "SMS send failed",
    );
  }

  if (contact_id) {
    await logCommunication({
      contact_id,
      project_id: project_id ?? null,
      channel: "sms",
      direction: "outbound",
      content_summary: message.substring(0, 200),
      metadata: { twilio_sid: result.sid },
    });
  }

  return createJsonResponse({ success: true, sms_sid: result.sid });
});
