import { supabaseAdmin } from "./supabaseAdmin.ts";

export async function findOrCreateConversation(
  contactId: number | null,
  channel: string,
  projectId?: number | null,
): Promise<number | null> {
  if (contactId) {
    const { data: existing } = await supabaseAdmin
      .from("conversations")
      .select("id")
      .eq("contact_id", contactId)
      .eq("channel", channel)
      .in("status", ["active", "escalated"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing?.[0]?.id) return existing[0].id;
  }

  const { data: newConv } = await supabaseAdmin
    .from("conversations")
    .insert({
      contact_id: contactId,
      channel,
      status: "active",
      ...(projectId ? { project_id: projectId } : {}),
    })
    .select("id")
    .single();

  return newConv?.id ?? null;
}
