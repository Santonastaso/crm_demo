import type { Identifier, RaRecord } from "ra-core";

export type ConversationChannel = "web_chat" | "whatsapp" | "email" | "phone";
export type ConversationStatus = "active" | "escalated" | "closed";

export type Conversation = {
  contact_id?: Identifier;
  project_id?: Identifier;
  channel: ConversationChannel;
  status: ConversationStatus;
  assigned_sales_id?: Identifier;
  created_at: string;
  updated_at: string;
} & Pick<RaRecord, "id">;

export type MessageSenderType = "contact" | "agent_ai" | "agent_human";

export type Message = {
  conversation_id: Identifier;
  sender_type: MessageSenderType;
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
} & Pick<RaRecord, "id">;
