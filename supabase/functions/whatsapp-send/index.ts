import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, createErrorResponse, createJsonResponse } from "../_shared/utils.ts";
import { logCommunication } from "../_shared/communicationLog.ts";
import { requirePost } from "../_shared/requestHandler.ts";

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

Deno.serve(async (req: Request) => {
  const earlyResponse = requirePost(req);
  if (earlyResponse) return earlyResponse;

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
        language: { code: Deno.env.get("WHATSAPP_TEMPLATE_LANG") ?? "it" },
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

  if (contact_id) {
    await logCommunication({
      contact_id,
      project_id: project_id ?? null,
      channel: "whatsapp",
      direction: "outbound",
      content_summary: message ?? `Template: ${template_name}`,
      metadata: { wa_message_id: waMessageId },
    });
  }

  return createJsonResponse({ success: true, wa_message_id: waMessageId });
});
