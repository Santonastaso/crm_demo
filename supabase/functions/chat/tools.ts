import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { invokeEdgeFunction } from "../_shared/invokeFunction.ts";
import {
  getContactById,
  contactFullName,
  primaryEmail,
} from "../_shared/contactUtils.ts";
import { searchKnowledgeBase } from "./knowledge.ts";

export const TOOLS = [
  {
    name: "search_knowledge_base",
    description:
      "Search the project knowledge base for information about properties, floor plans, pricing, payment methods, returns, and other details.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query" },
      },
      required: ["query"],
    },
  },
  {
    name: "book_videocall",
    description:
      "Book a video call with a sales representative, or check available time slots. Use when the prospect wants to schedule a meeting.",
    input_schema: {
      type: "object",
      properties: {
        preferred_date: {
          type: "string",
          description: "Preferred date in YYYY-MM-DD format",
        },
        preferred_time: {
          type: "string",
          description: "Preferred time in HH:MM format",
        },
      },
      required: [],
    },
  },
  {
    name: "create_lead",
    description:
      "Save or update lead information captured during the conversation.",
    input_schema: {
      type: "object",
      properties: {
        first_name: { type: "string" },
        last_name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        budget: { type: "string" },
        interest_type: {
          type: "string",
          description:
            "Type of interest: full_ownership, fractional_1_20, investment",
        },
      },
      required: ["first_name"],
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Transfer the conversation to a human agent. Use for legal questions, price negotiations, or sensitive situations.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Reason for escalation" },
      },
      required: ["reason"],
    },
  },
];

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  resolvedContactId: number | null,
  conversationId: number,
  projectId: number | null,
): Promise<string> {
  switch (toolName) {
    case "search_knowledge_base": {
      return await searchKnowledgeBase(
        (toolInput.query as string) ?? "",
        projectId,
      );
    }
    case "create_lead": {
      const input = toolInput as Record<string, string>;
      if (resolvedContactId) {
        await supabaseAdmin
          .from("contacts")
          .update({
            first_name: input.first_name,
            last_name: input.last_name,
            last_seen: new Date().toISOString(),
          })
          .eq("id", resolvedContactId);
        return `Lead updated: ${input.first_name} ${input.last_name ?? ""}`;
      }
      const { data: newContact } = await supabaseAdmin
        .from("contacts")
        .insert({
          first_name: input.first_name ?? "Unknown",
          last_name: input.last_name ?? "",
          status: "cold",
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          has_newsletter: false,
          tags: [],
          email_jsonb: input.email
            ? [{ email: input.email, type: "Work" }]
            : [],
          phone_jsonb: input.phone
            ? [{ number: input.phone, type: "Work" }]
            : [],
          source: "website_chat",
        })
        .select("id")
        .single();

      if (newContact) {
        await supabaseAdmin
          .from("conversations")
          .update({ contact_id: newContact.id })
          .eq("id", conversationId);
      }
      return `Lead created: ${input.first_name} ${input.last_name ?? ""} (ID: ${newContact?.id ?? "unknown"})`;
    }
    case "escalate_to_human": {
      await supabaseAdmin
        .from("conversations")
        .update({ status: "escalated" })
        .eq("id", conversationId);
      return "Conversation escalated to a human agent. They will respond shortly.";
    }
    case "book_videocall": {
      const bookingInput = toolInput as Record<string, string>;

      let contactName = "Prospect";
      let contactEmail = "prospect@crm.local";
      if (resolvedContactId) {
        const cRec = await getContactById(resolvedContactId);
        if (cRec) {
          contactName = contactFullName(cRec);
          contactEmail = primaryEmail(cRec) ?? contactEmail;
        }
      }

      const bookPayload: Record<string, unknown> = {
        action: bookingInput.preferred_date ? "book" : "slots",
        date:
          bookingInput.preferred_date ??
          new Date().toISOString().split("T")[0],
        contact_id: resolvedContactId,
        conversation_id: conversationId,
        name: contactName,
        email: contactEmail,
      };
      if (bookingInput.preferred_time) {
        bookPayload.preferred_time = bookingInput.preferred_time;
      }

      try {
        const bookRes = await invokeEdgeFunction(
          "book-videocall",
          bookPayload,
        );
        const bookData = await bookRes.json();
        if (bookRes.ok && bookData.booking_id) {
          return `Video call booked successfully for ${bookData.scheduled_at}. Booking confirmed.`;
        } else if (bookRes.ok && bookData.slots) {
          const slotList = bookData.slots
            .slice(0, 10)
            .map(
              (s: { date: string; time: string }) => `${s.date} at ${s.time}`,
            )
            .join("\n- ");
          return `Available time slots:\n- ${slotList}`;
        }
        return `Booking request processed but no confirmation received. ${JSON.stringify(bookData)}`;
      } catch (bookErr) {
        console.error("book-videocall error:", bookErr);
        await supabaseAdmin.from("bookings").insert({
          conversation_id: conversationId,
          contact_id: resolvedContactId,
          status: "pending",
        });
        return "Booking service temporarily unavailable. A pending booking has been created and an agent will follow up.";
      }
    }
    default:
      return `Unknown tool: ${toolName}`;
  }
}
