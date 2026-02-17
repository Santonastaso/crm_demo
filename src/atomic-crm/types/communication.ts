import type { Identifier, RaRecord } from "ra-core";

export type CommunicationDirection = "inbound" | "outbound";

export type CommunicationLog = {
  contact_id?: Identifier;
  project_id?: Identifier;
  channel: string;
  direction: CommunicationDirection;
  content_summary?: string;
  subject?: string;
  external_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
} & Pick<RaRecord, "id">;

export type EmailAccount = {
  sales_id: Identifier;
  email_address: string;
  access_token: string;
  refresh_token: string;
  token_expires_at?: string;
  last_sync_history_id?: string;
  last_synced_at?: string;
  created_at: string;
} & Pick<RaRecord, "id">;
