import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, createErrorResponse } from "../_shared/utils.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are an AI sales assistant for a real estate agency. You help potential buyers and partners with information about real estate projects, properties, and services.

CAPABILITIES:
- Answer questions about properties, floor plans, pricing, payment methods, expected returns, taxation, and purchase processes
- Support Italian, English, and German languages (detect automatically)
- Capture lead information (name, email, phone, budget, interest type) naturally during conversation
- Search the knowledge base for specific property and project details
- Book video calls with sales representatives when the prospect is ready
- Escalate to human agents when the conversation exceeds your scope

GUARDRAILS:
- NEVER provide binding legal or tax advice
- NEVER close sales or sign preliminary agreements
- NEVER communicate unauthorized prices or conditions not found in the knowledge base
- ALWAYS escalate requests outside your configured scope
- Be professional, warm, and helpful
- When presenting tool results (like available slots or booking confirmations), integrate them naturally into your response`;

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
}

async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "text-embedding-3-small", input: query }),
    });
    const result = await response.json();
    return result.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

async function searchKnowledgeBase(
  query: string,
  projectId: number | null,
): Promise<string> {
  const embedding = await generateQueryEmbedding(query);

  if (embedding) {
    const { data, error } = await supabaseAdmin.rpc("match_document_chunks", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
      filter_project_id: projectId,
    });

    if (!error && data?.length) {
      return data.map((chunk: { content: string }) => chunk.content).join("\n\n---\n\n");
    }
  }

  let textQuery = supabaseAdmin
    .from("document_chunks")
    .select("content, document_id")
    .ilike("content", `%${query.split(" ").slice(0, 3).join("%")}%`)
    .limit(5);

  if (projectId) {
    const { data: docIds } = await supabaseAdmin
      .from("knowledge_documents")
      .select("id")
      .eq("project_id", projectId);
    if (docIds?.length) {
      textQuery = textQuery.in("document_id", docIds.map((d: { id: number }) => d.id));
    }
  }

  const { data: textResults } = await textQuery;

  if (textResults?.length) {
    return textResults.map((chunk: { content: string }) => chunk.content).join("\n\n---\n\n");
  }

  return "No relevant information found in the knowledge base.";
}

async function getConversationHistory(
  conversationId: number,
): Promise<ClaudeMessage[]> {
  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("sender_type, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  return (messages ?? []).map((m: { sender_type: string; content: string }) => ({
    role: m.sender_type === "contact" ? "user" as const : "assistant" as const,
    content: m.content,
  }));
}

const TOOLS = [
  {
    name: "search_knowledge_base",
    description: "Search the project knowledge base for information about properties, floor plans, pricing, payment methods, returns, and other details.",
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
    description: "Book a video call with a sales representative, or check available time slots. Use when the prospect wants to schedule a meeting.",
    input_schema: {
      type: "object",
      properties: {
        preferred_date: { type: "string", description: "Preferred date in YYYY-MM-DD format" },
        preferred_time: { type: "string", description: "Preferred time in HH:MM format" },
      },
      required: [],
    },
  },
  {
    name: "create_lead",
    description: "Save or update lead information captured during the conversation.",
    input_schema: {
      type: "object",
      properties: {
        first_name: { type: "string" },
        last_name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        budget: { type: "string" },
        interest_type: { type: "string", description: "Type of interest: full_ownership, fractional_1_20, investment" },
      },
      required: ["first_name"],
    },
  },
  {
    name: "escalate_to_human",
    description: "Transfer the conversation to a human agent. Use for legal questions, price negotiations, or sensitive situations.",
    input_schema: {
      type: "object",
      properties: {
        reason: { type: "string", description: "Reason for escalation" },
      },
      required: ["reason"],
    },
  },
];

async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  resolvedContactId: number | null,
  conversationId: number,
  projectId: number | null,
): Promise<string> {
  switch (toolName) {
    case "search_knowledge_base": {
      const query = (toolInput.query as string) ?? "";
      const result = await searchKnowledgeBase(query, projectId);
      return result;
    }
    case "create_lead": {
      const input = toolInput as Record<string, string>;
      if (resolvedContactId) {
        await supabaseAdmin.from("contacts").update({
          first_name: input.first_name,
          last_name: input.last_name,
          last_seen: new Date().toISOString(),
        }).eq("id", resolvedContactId);
        return `Lead updated: ${input.first_name} ${input.last_name ?? ""}`;
      } else {
        const { data: newContact } = await supabaseAdmin.from("contacts").insert({
          first_name: input.first_name ?? "Unknown",
          last_name: input.last_name ?? "",
          status: "cold",
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          has_newsletter: false,
          tags: [],
          email_jsonb: input.email ? [{ email: input.email, type: "Work" }] : [],
          phone_jsonb: input.phone ? [{ number: input.phone, type: "Work" }] : [],
        }).select("id").single();

        if (newContact) {
          await supabaseAdmin.from("conversations").update({
            contact_id: newContact.id,
          }).eq("id", conversationId);
        }
        return `Lead created: ${input.first_name} ${input.last_name ?? ""} (ID: ${newContact?.id ?? "unknown"})`;
      }
    }
    case "escalate_to_human": {
      await supabaseAdmin.from("conversations").update({
        status: "escalated",
      }).eq("id", conversationId);
      return "Conversation escalated to a human agent. They will respond shortly.";
    }
    case "book_videocall": {
      const bookingInput = toolInput as Record<string, string>;
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

      let contactName = "Prospect";
      let contactEmail = "prospect@crm.local";
      if (resolvedContactId) {
        const { data: cRec } = await supabaseAdmin
          .from("contacts")
          .select("first_name, last_name, email_jsonb")
          .eq("id", resolvedContactId)
          .single();
        if (cRec) {
          contactName = `${cRec.first_name ?? ""} ${cRec.last_name ?? ""}`.trim() || "Prospect";
          const emails = cRec.email_jsonb ?? [];
          contactEmail = emails[0]?.email ?? contactEmail;
        }
      }

      const bookPayload: Record<string, unknown> = {
        action: bookingInput.preferred_date ? "book" : "slots",
        date: bookingInput.preferred_date ?? new Date().toISOString().split("T")[0],
        contact_id: resolvedContactId,
        conversation_id: conversationId,
        name: contactName,
        email: contactEmail,
      };
      if (bookingInput.preferred_time) {
        bookPayload.preferred_time = bookingInput.preferred_time;
      }

      try {
        const bookRes = await fetch(`${supabaseUrl}/functions/v1/book-videocall`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bookPayload),
        });

        const bookData = await bookRes.json();
        if (bookRes.ok && bookData.booking_id) {
          return `Video call booked successfully for ${bookData.scheduled_at}. Booking confirmed.`;
        } else if (bookRes.ok && bookData.slots) {
          const slotList = bookData.slots
            .slice(0, 10)
            .map((s: { date: string; time: string }) => `${s.date} at ${s.time}`)
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

async function callClaude(
  anthropicKey: string,
  messages: ClaudeMessage[],
): Promise<{ ok: boolean; result: Record<string, unknown>; status: number }> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
      tools: TOOLS,
    }),
  });

  const result = await response.json();
  return { ok: response.ok, result, status: response.status };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return createErrorResponse(405, "Method Not Allowed");
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return createErrorResponse(400, "Invalid JSON body");
  }

  const { message, conversation_id, project_id } = body;
  let { contact_id } = body;

  if (!message || typeof message !== "string") {
    return createErrorResponse(400, "message is required");
  }

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    return createErrorResponse(500, "ANTHROPIC_API_KEY not configured");
  }

  let conversationId = conversation_id as number | undefined;

  // Create conversation if none provided
  if (!conversationId) {
    const { data: conv, error: convError } = await supabaseAdmin
      .from("conversations")
      .insert({
        contact_id: (contact_id as number) ?? null,
        project_id: (project_id as number) ?? null,
        channel: "web_chat",
        status: "active",
      })
      .select("id")
      .single();

    if (convError) {
      console.error("Conversation insert error:", convError);
      return createErrorResponse(500, "Failed to create conversation");
    }
    conversationId = conv?.id;
  }

  if (!conversationId) {
    return createErrorResponse(500, "Failed to create conversation");
  }

  // Load contact_id from conversation if not provided
  if (!contact_id) {
    const { data: convRecord } = await supabaseAdmin
      .from("conversations")
      .select("contact_id")
      .eq("id", conversationId)
      .single();
    if (convRecord?.contact_id) {
      contact_id = convRecord.contact_id;
    }
  }

  const resolvedContactId = (contact_id as number) ?? null;
  const resolvedProjectId = (project_id as number) ?? null;

  try {
    // Save user message
    const { error: msgError } = await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      sender_type: "contact",
      content: message,
    });

    if (msgError) {
      console.error("Message insert error:", msgError);
      return createErrorResponse(500, "Failed to save message");
    }

    // Get conversation history
    const history = await getConversationHistory(conversationId);

    // Search knowledge base for context
    const kbContext = await searchKnowledgeBase(message, resolvedProjectId);

    // Build initial messages for Claude
    const claudeMessages: ClaudeMessage[] = [
      ...history.slice(-18),
      {
        role: "user" as const,
        content: `[Knowledge Base Context]\n${kbContext}\n\n[User Message]\n${message}`,
      },
    ];

    // Tool-use loop: call Claude, handle tools, call again if needed (max 3 iterations)
    let aiResponseText = "";
    const allToolCalls: Array<{ name: string; input: Record<string, unknown> }> = [];

    for (let iteration = 0; iteration < 3; iteration++) {
      const { ok, result: claudeResult } = await callClaude(anthropicKey, claudeMessages);

      if (!ok) {
        console.error("Claude API error:", JSON.stringify(claudeResult));
        const errMsg = (claudeResult as Record<string, Record<string, string>>)?.error?.message;
        const userMsg = errMsg?.includes("credit balance")
          ? "AI service unavailable — billing issue. Please check your Anthropic account."
          : "AI service error";
        return createErrorResponse(500, userMsg);
      }

      const content = (claudeResult as Record<string, Array<Record<string, unknown>>>).content ?? [];
      const stopReason = (claudeResult as Record<string, string>).stop_reason;

      // Collect text and tool_use blocks
      const textParts: string[] = [];
      const toolUseBlocks: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

      for (const block of content) {
        if (block.type === "text") {
          textParts.push(block.text as string);
        } else if (block.type === "tool_use") {
          toolUseBlocks.push({
            id: block.id as string,
            name: block.name as string,
            input: block.input as Record<string, unknown>,
          });
        }
      }

      if (textParts.length > 0) {
        aiResponseText = textParts.join("");
      }

      // If no tool calls, we're done
      if (toolUseBlocks.length === 0 || stopReason !== "tool_use") {
        break;
      }

      // Execute tools and build tool_result messages
      const toolResults: Array<Record<string, unknown>> = [];

      for (const toolBlock of toolUseBlocks) {
        allToolCalls.push({ name: toolBlock.name, input: toolBlock.input });
        const result = await executeTool(
          toolBlock.name,
          toolBlock.input,
          resolvedContactId,
          conversationId,
          resolvedProjectId,
        );
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolBlock.id,
          content: result,
        });
      }

      // Append assistant response and tool results to messages for next iteration
      claudeMessages.push({
        role: "assistant",
        content: content as Array<Record<string, unknown>>,
      });
      claudeMessages.push({
        role: "user",
        content: toolResults,
      });
    }

    // Re-read contact_id from conversation (may have been updated by create_lead)
    let finalContactId = resolvedContactId;
    if (!finalContactId) {
      const { data: convCheck } = await supabaseAdmin
        .from("conversations")
        .select("contact_id")
        .eq("id", conversationId)
        .single();
      finalContactId = convCheck?.contact_id ?? null;
    }

    // Save AI response
    await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      sender_type: "agent_ai",
      content: aiResponseText,
      metadata: { tool_calls: allToolCalls },
    });

    // Log to communication_log
    if (finalContactId) {
      await supabaseAdmin.from("communication_log").insert([
        {
          contact_id: finalContactId,
          project_id: resolvedProjectId,
          channel: "web_chat",
          direction: "inbound",
          content_summary: (message as string).substring(0, 500),
        },
        {
          contact_id: finalContactId,
          project_id: resolvedProjectId,
          channel: "web_chat",
          direction: "outbound",
          content_summary: aiResponseText.substring(0, 500),
        },
      ]);
    }

    return new Response(
      JSON.stringify({
        conversation_id: conversationId,
        response: aiResponseText,
        tool_calls: allToolCalls,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    console.error("Chat handler error:", err);
    return createErrorResponse(
      500,
      err instanceof Error ? err.message : "Internal server error",
    );
  }
});
