import type { Identifier, RaRecord } from "ra-core";

export type CampaignStatus = "draft" | "scheduled" | "sending" | "completed" | "paused";
export type CampaignChannel = "email" | "whatsapp" | "sms" | "multi";

export type Campaign = {
  project_id?: Identifier;
  name: string;
  segment_id?: Identifier;
  template_id?: Identifier;
  status: CampaignStatus;
  channel: CampaignChannel;
  created_at: string;
  scheduled_at?: string;
  completed_at?: string;
  sales_id?: Identifier;
} & Pick<RaRecord, "id">;

export type CampaignStep = {
  campaign_id: Identifier;
  step_order: number;
  channel: string;
  template_content: Record<string, unknown>;
  delay_hours: number;
  condition: Record<string, unknown>;
} & Pick<RaRecord, "id">;

export type CampaignSendStatus =
  | "pending" | "sent" | "delivered" | "opened"
  | "clicked" | "replied" | "bounced" | "failed";

export type CampaignSend = {
  campaign_id: Identifier;
  step_id?: Identifier;
  contact_id: Identifier;
  channel: string;
  status: CampaignSendStatus;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  external_id?: string;
} & Pick<RaRecord, "id">;

export type Template = {
  project_id?: Identifier;
  name: string;
  channel: string;
  subject?: string;
  body: string;
  variables: Array<{ name: string; default_value?: string }>;
  created_at: string;
  sales_id?: Identifier;
} & Pick<RaRecord, "id">;
