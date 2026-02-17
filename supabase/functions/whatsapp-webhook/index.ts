import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createErrorResponse, createJsonResponse } from "../_shared/utils.ts";
import { logCommunication } from "../_shared/communicationLog.ts";
import { invokeEdgeFunction } from "../_shared/invokeFunction.ts";
import { findOrCreateContactByPhone } from "../_shared/contactUtils.ts";
import { findOrCreateConversation } from "../_shared/conversationUtils.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken) {
      return new Response(challenge, { status: 200 });
    }
    return createErrorResponse(403, "Forbidden");
  }

  if (req.method !== "POST") {
    return createErrorResponse(405, "Method Not Allowed");
  }

  const body = await req.json();

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;

      const value = change.value;

      for (const msg of value.messages ?? []) {
        if (msg.type !== "text") continue;

        const fromPhone = msg.from;
        const messageText = msg.text?.body;
        if (!messageText) continue;

        const profileName =
          value.contacts?.[0]?.profile?.name ?? "WhatsApp User";
        const contactId = await findOrCreateContactByPhone(
          fromPhone,
          profileName,
        );
        const conversationId = await findOrCreateConversation(
          contactId,
          "whatsapp",
        );

        try {
          const chatResponse = await invokeEdgeFunction("chat", {
            message: messageText,
            conversation_id: conversationId,
            contact_id: contactId,
          });

          if (chatResponse.ok) {
            const chatData = await chatResponse.json();
            const aiReply = chatData?.response;

            if (aiReply && fromPhone) {
              await invokeEdgeFunction("whatsapp-send", {
                to: fromPhone,
                message: aiReply,
                contact_id: contactId,
              });
            }
          }
        } catch (err) {
          console.error("Chat/reply error:", err);
        }

        if (contactId) {
          await logCommunication({
            contact_id: contactId,
            channel: "whatsapp",
            direction: "inbound",
            content_summary: messageText.substring(0, 200),
            metadata: { wa_message_id: msg.id, from: fromPhone },
          });
        }
      }
    }
  }

  return createJsonResponse({ status: "ok" });
});
