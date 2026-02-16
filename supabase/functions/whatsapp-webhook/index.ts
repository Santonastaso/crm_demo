import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, createErrorResponse } from "../_shared/utils.ts";
import { logCommunication } from "../_shared/communicationLog.ts";
import { invokeEdgeFunction } from "../_shared/invokeFunction.ts";

Deno.serve(async (req: Request) => {
  // WhatsApp webhook verification (GET)
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

  // Process WhatsApp webhook payload
  const entries = body.entry ?? [];
  for (const entry of entries) {
    const changes = entry.changes ?? [];
    for (const change of changes) {
      if (change.field !== "messages") continue;

      const value = change.value;
      const messages = value.messages ?? [];

      for (const msg of messages) {
        if (msg.type !== "text") continue;

        const fromPhone = msg.from;
        const messageText = msg.text?.body;

        if (!messageText) continue;

        // Find or create contact by phone number
        const { data: existingContacts } = await supabaseAdmin
          .from("contacts")
          .select("id")
          .contains("phone_jsonb", [{ number: fromPhone }])
          .limit(1);

        let contactId = existingContacts?.[0]?.id ?? null;

        if (!contactId) {
          const profileName = value.contacts?.[0]?.profile?.name ?? "WhatsApp User";
          const nameParts = profileName.split(" ");
          const { data: newContact } = await supabaseAdmin
            .from("contacts")
            .insert({
              first_name: nameParts[0] ?? "Unknown",
              last_name: nameParts.slice(1).join(" ") || "",
              phone_jsonb: [{ number: fromPhone, type: "Work" }],
              email_jsonb: [],
              status: "cold",
              first_seen: new Date().toISOString(),
              last_seen: new Date().toISOString(),
              has_newsletter: false,
              tags: [],
            })
            .select("id")
            .single();
          contactId = newContact?.id ?? null;
        }

        // Find or create conversation
        let conversationId: number | null = null;
        if (contactId) {
          const { data: existingConv } = await supabaseAdmin
            .from("conversations")
            .select("id")
            .eq("contact_id", contactId)
            .eq("channel", "whatsapp")
            .in("status", ["active", "escalated"])
            .order("created_at", { ascending: false })
            .limit(1);

          conversationId = existingConv?.[0]?.id ?? null;
        }

        if (!conversationId) {
          const { data: newConv } = await supabaseAdmin
            .from("conversations")
            .insert({
              contact_id: contactId,
              channel: "whatsapp",
              status: "active",
            })
            .select("id")
            .single();
          conversationId = newConv?.id ?? null;
        }

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

  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
