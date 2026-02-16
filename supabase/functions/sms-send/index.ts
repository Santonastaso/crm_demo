import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, createErrorResponse } from "../_shared/utils.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return createErrorResponse(405, "Method Not Allowed");
  }

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

  // Log to communication_log
  if (contact_id) {
    await supabaseAdmin.from("communication_log").insert({
      contact_id,
      project_id: project_id ?? null,
      channel: "sms",
      direction: "outbound",
      content_summary: message.substring(0, 200),
      metadata: { twilio_sid: result.sid },
    });
  }

  return new Response(
    JSON.stringify({ success: true, sms_sid: result.sid }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
