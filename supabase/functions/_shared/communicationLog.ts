import { supabaseAdmin } from "./supabaseAdmin.ts";

export interface CommunicationLogEntry {
  contact_id: number | null;
  channel: string;
  direction: "inbound" | "outbound";
  content_summary: string;
  subject?: string;
  external_id?: string;
  metadata?: Record<string, unknown>;
  project_id?: number | null;
  created_at?: string;
}

export async function logCommunication(entry: CommunicationLogEntry) {
  return supabaseAdmin.from("communication_log").insert(entry);
}

export async function logCommunicationBatch(entries: CommunicationLogEntry[]) {
  return supabaseAdmin.from("communication_log").insert(entries);
}
