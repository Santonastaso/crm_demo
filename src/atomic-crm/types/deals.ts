import type { Identifier, RaRecord } from "ra-core";
import type { AttachmentNote } from "./core";

export type Deal = {
  name: string;
  company_id: Identifier;
  contact_ids: Identifier[];
  category: string;
  stage: string;
  description: string;
  amount: number;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  expected_closing_date: string;
  stage_entered_at?: string;
  sales_id: Identifier;
  project_id?: Identifier;
  unit_ids: Identifier[];
  index: number;
} & Pick<RaRecord, "id">;

export type DealNote = {
  deal_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  attachments?: AttachmentNote[];
  // Defined for compatibility with ContactNote
  status?: undefined;
} & Pick<RaRecord, "id">;

export type DealInteraction = {
  deal_id: Identifier;
  sales_id: Identifier;
  type: string;
  date: string;
  duration?: number;
  participant_ids?: Identifier[];
  notes?: string;
  attachments?: AttachmentNote[];
  sentiment?: string;
  amount?: number;
  offer_status?: string;
} & Pick<RaRecord, "id">;

export type Reminder = {
  sales_id: Identifier;
  created_at: string;
  entity_type: string;
  entity_id: Identifier;
  trigger_type: string;
  trigger_date: string;
  action_text: string;
  description?: string;
  priority: string;
  status: string;
  notify_user_ids?: Identifier[];
} & Pick<RaRecord, "id">;
