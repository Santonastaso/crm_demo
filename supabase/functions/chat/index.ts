import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createErrorResponse, createJsonResponse } from "../_shared/utils.ts";
import { logCommunicationBatch } from "../_shared/communicationLog.ts";
import { requirePost } from "../_shared/requestHandler.ts";
import { parseJsonBody } from "../_shared/parseJsonBody.ts";

import { callClaude } from "./claude.ts";
import type { ClaudeMessage } from "./claude.ts";
import { searchKnowledgeBase } from "./knowledge.ts";
import { getConversationHistory } from "./conversation.ts";
import { executeTool } from "./tools.ts";

Deno.serve(async (req: Request) => {
  const earlyResponse = requirePost(req);
  if (earlyResponse) return earlyResponse;

  const parsed = await parseJsonBody<{
    message?: unknown;
    conversation_id?: unknown;
    project_id?: unknown;
    contact_id?: unknown;
  }>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
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

  if (!contact_id) {
    const { data: convRecord } = await supabaseAdmin
      .from("conversations")
      .select("contact_id")
      .eq("id", conversationId)
      .single();
    if (convRecord?.contact_id) contact_id = convRecord.contact_id;
  }

  const resolvedContactId = (contact_id as number) ?? null;
  const resolvedProjectId = (project_id as number) ?? null;

  try {
    const { error: msgError } = await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      sender_type: "contact",
      content: message,
    });
    if (msgError) {
      console.error("Message insert error:", msgError);
      return createErrorResponse(500, "Failed to save message");
    }

    const history = await getConversationHistory(conversationId);
    const kbContext = await searchKnowledgeBase(message, resolvedProjectId);

    const claudeMessages: ClaudeMessage[] = [
      ...history.slice(-18),
      {
        role: "user",
        content: `[Knowledge Base Context]\n${kbContext}\n\n[User Message]\n${message}`,
      },
    ];

    let aiResponseText = "";
    const allToolCalls: Array<{
      name: string;
      input: Record<string, unknown>;
    }> = [];

    for (let iteration = 0; iteration < 3; iteration++) {
      const { ok, result: claudeResult } = await callClaude(
        anthropicKey,
        claudeMessages,
      );

      if (!ok) {
        console.error("Claude API error:", JSON.stringify(claudeResult));
        const errMsg = (
          claudeResult as Record<string, Record<string, string>>
        )?.error?.message;
        const userMsg = errMsg?.includes("credit balance")
          ? "AI service unavailable — billing issue. Please check your Anthropic account."
          : "AI service error";
        return createErrorResponse(500, userMsg);
      }

      const content = (
        claudeResult as Record<string, Array<Record<string, unknown>>>
      ).content ?? [];
      const stopReason = (claudeResult as Record<string, string>).stop_reason;

      const textParts: string[] = [];
      const toolUseBlocks: Array<{
        id: string;
        name: string;
        input: Record<string, unknown>;
      }> = [];

      for (const block of content) {
        if (block.type === "text") textParts.push(block.text as string);
        else if (block.type === "tool_use") {
          toolUseBlocks.push({
            id: block.id as string,
            name: block.name as string,
            input: block.input as Record<string, unknown>,
          });
        }
      }

      if (textParts.length > 0) aiResponseText = textParts.join("");
      if (toolUseBlocks.length === 0 || stopReason !== "tool_use") break;

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

      claudeMessages.push({
        role: "assistant",
        content: content as Array<Record<string, unknown>>,
      });
      claudeMessages.push({ role: "user", content: toolResults });
    }

    let finalContactId = resolvedContactId;
    if (!finalContactId) {
      const { data: convCheck } = await supabaseAdmin
        .from("conversations")
        .select("contact_id")
        .eq("id", conversationId)
        .single();
      finalContactId = convCheck?.contact_id ?? null;
    }

    await supabaseAdmin.from("messages").insert({
      conversation_id: conversationId,
      sender_type: "agent_ai",
      content: aiResponseText,
      metadata: { tool_calls: allToolCalls },
    });

    if (finalContactId) {
      await logCommunicationBatch([
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

    return createJsonResponse({
      conversation_id: conversationId,
      response: aiResponseText,
      tool_calls: allToolCalls,
    });
  } catch (err) {
    console.error("Chat handler error:", err);
    return createErrorResponse(
      500,
      err instanceof Error ? err.message : "Internal server error",
    );
  }
});
