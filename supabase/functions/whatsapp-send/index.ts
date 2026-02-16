import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, createErrorResponse } from "../_shared/utils.ts";

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return createErrorResponse(405, "Method Not Allowed");
  }

  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

  if (!phoneNumberId || !accessToken) {
    return createErrorResponse(500, "WhatsApp API credentials not configured");
  }

  const { to, message, contact_id, project_id, template_name, template_params } =
    await req.json();

  if (!to) {
    return createErrorResponse(400, "Recipient phone number (to) is required");
  }

  let body: Record<string, unknown>;

  if (template_name) {
    body = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template_name,
        language: { code: "it" },
        components: template_params
          ? [
              {
                type: "body",
                parameters: template_params.map((p: string) => ({
                  type: "text",
                  text: p,
                })),
              },
            ]
          : [],
      },
    };
  } else {
    if (!message) {
      return createErrorResponse(400, "message or template_name is required");
    }
    body = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    };
  }

  const response = await fetch(
    `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    console.error("WhatsApp API error:", result);
    return createErrorResponse(response.status, result.error?.message ?? "WhatsApp send failed");
  }

  const waMessageId = result.messages?.[0]?.id;

  // Log to communication_log
  if (contact_id) {
    await supabaseAdmin.from("communication_log").insert({
      contact_id,
      project_id: project_id ?? null,
      channel: "whatsapp",
      direction: "outbound",
      content_summary: message ?? `Template: ${template_name}`,
      metadata: { wa_message_id: waMessageId },
    });
  }

  return new Response(
    JSON.stringify({ success: true, wa_message_id: waMessageId }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
