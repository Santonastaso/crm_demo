import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import type { ClaudeMessage } from "./claude.ts";

export async function getConversationHistory(
  conversationId: number,
): Promise<ClaudeMessage[]> {
  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("sender_type, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  return (messages ?? []).map(
    (m: { sender_type: string; content: string }) => ({
      role:
        m.sender_type === "contact"
          ? ("user" as const)
          : ("assistant" as const),
      content: m.content,
    }),
  );
}
