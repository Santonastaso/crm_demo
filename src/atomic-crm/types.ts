import type { Identifier, RaRecord } from "ra-core";
import type { ComponentType } from "react";
import type {
  COMPANY_CREATED,
  CONTACT_CREATED,
  CONTACT_NOTE_CREATED,
  DEAL_CREATED,
  DEAL_NOTE_CREATED,
} from "./consts";

export type SignUpData = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type UserRole = "admin" | "manager" | "agent" | "read_only";

export type SalesFormData = {
  avatar: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  /** @deprecated use role instead */
  administrator: boolean;
  role: UserRole;
  disabled: boolean;
};

export type Sale = {
  first_name: string;
  last_name: string;
  /** @deprecated use role instead */
  administrator: boolean;
  role: UserRole;
  avatar?: RAFile;
  disabled?: boolean;
  user_id: string;

  /**
   * This is a copy of the user's email, to make it easier to handle by react admin
   * DO NOT UPDATE this field directly, it should be updated by the backend
   */
  email: string;

  /**
   * This is used by the fake rest provider to store the password
   * DO NOT USE this field in your code besides the fake rest provider
   * @deprecated
   */
  password?: string;
} & Pick<RaRecord, "id">;

export type Company = {
  name: string;
  logo: RAFile;
  sector: string;
  size: 1 | 10 | 50 | 250 | 500;
  linkedin_url: string;
  website: string;
  phone_number: string;
  address: string;
  zipcode: string;
  city: string;
  stateAbbr: string;
  sales_id: Identifier;
  created_at: string;
  description: string;
  revenue: string;
  tax_identifier: string;
  country: string;
  context_links?: string[];
  nb_contacts?: number;
  nb_deals?: number;
} & Pick<RaRecord, "id">;

export type EmailAndType = {
  email: string;
  type: "Work" | "Home" | "Other";
};

export type PhoneNumberAndType = {
  number: string;
  type: "Work" | "Home" | "Other";
};

export type Contact = {
  first_name: string;
  last_name: string;
  title: string;
  company_id: Identifier;
  email_jsonb: EmailAndType[];
  avatar?: Partial<RAFile>;
  linkedin_url?: string | null;
  first_seen: string;
  last_seen: string;
  has_newsletter: boolean;
  tags: Identifier[];
  gender: string;
  sales_id: Identifier;
  status: string;
  background: string;
  phone_jsonb: PhoneNumberAndType[];
  lead_type?: string;
  nb_tasks?: number;
  company_name?: string;
} & Pick<RaRecord, "id">;

export type ContactNote = {
  contact_id: Identifier;
  text: string;
  date: string;
  sales_id: Identifier;
  status: string;
  attachments?: AttachmentNote[];
} & Pick<RaRecord, "id">;

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

  // This is defined for compatibility with `ContactNote`
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

export type Tag = {
  name: string;
  color: string;
} & Pick<RaRecord, "id">;

export type Task = {
  contact_id: Identifier;
  type: string;
  text: string;
  due_date: string;
  done_date?: string | null;
  sales_id?: Identifier;
} & Pick<RaRecord, "id">;

export type ActivityCompanyCreated = {
  type: typeof COMPANY_CREATED;
  company_id: Identifier;
  company: Company;
  sales_id: Identifier;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityContactCreated = {
  type: typeof CONTACT_CREATED;
  company_id: Identifier;
  sales_id?: Identifier;
  contact: Contact;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityContactNoteCreated = {
  type: typeof CONTACT_NOTE_CREATED;
  sales_id?: Identifier;
  contactNote: ContactNote;
  date: string;
} & Pick<RaRecord, "id">;

export type ActivityDealCreated = {
  type: typeof DEAL_CREATED;
  company_id: Identifier;
  sales_id?: Identifier;
  deal: Deal;
  date: string;
};

export type ActivityDealNoteCreated = {
  type: typeof DEAL_NOTE_CREATED;
  sales_id?: Identifier;
  dealNote: DealNote;
  date: string;
};

export type Activity = RaRecord &
  (
    | ActivityCompanyCreated
    | ActivityContactCreated
    | ActivityContactNoteCreated
    | ActivityDealCreated
    | ActivityDealNoteCreated
  );

export interface RAFile {
  src: string;
  title: string;
  path?: string;
  rawFile: File;
  type?: string;
}

export type AttachmentNote = RAFile;
export interface DealStage {
  value: string;
  label: string;
}

export interface NoteStatus {
  value: string;
  label: string;
  color: string;
}

export interface ContactGender {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

// =============================================================================
// Projects
// =============================================================================

export type Project = {
  name: string;
  slug: string;
  description?: string;
  location?: string;
  location_lat?: number;
  location_lng?: number;
  status: "active" | "archived";
  config?: Record<string, unknown>;
  created_at: string;
} & Pick<RaRecord, "id">;

export type PropertyUnit = {
  project_id: Identifier;
  code: string;
  typology?: string;
  floor?: number;
  orientation?: string;
  square_meters?: number;
  rooms?: number;
  bathrooms?: number;
  energy_class?: string;
  base_price?: number;
  current_price?: number;
  discount_pct?: number;
  status: "disponibile" | "opzionato" | "compromesso" | "rogitato";
  description?: string;
  features?: string[];
  created_at: string;
  updated_at: string;
} & Pick<RaRecord, "id">;

export type UnitDocument = {
  unit_id: Identifier;
  title: string;
  doc_type?: string;
  file_path: string;
  file_type?: string;
  created_at: string;
} & Pick<RaRecord, "id">;

export type ProjectPipeline = {
  project_id: Identifier;
  stage_name: string;
  stage_order: number;
  is_terminal: boolean;
} & Pick<RaRecord, "id">;

// =============================================================================
// Segments
// =============================================================================

export type SegmentCriterion = {
  field: string;
  operator: "eq" | "neq" | "contains" | "gt" | "lt" | "gte" | "lte" | "in" | "not_in";
  value: string | number | boolean | string[];
};

export type Segment = {
  name: string;
  project_id?: Identifier;
  criteria: SegmentCriterion[];
  auto_refresh: boolean;
  last_refreshed_at?: string;
  created_at: string;
  sales_id?: Identifier;
} & Pick<RaRecord, "id">;

export type SegmentContact = {
  segment_id: Identifier;
  contact_id: Identifier;
  added_at: string;
};

// =============================================================================
// Conversations & Messages
// =============================================================================

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

// =============================================================================
// Knowledge Base
// =============================================================================

export type KnowledgeDocumentStatus = "pending" | "processed" | "error";

export type KnowledgeDocument = {
  project_id: Identifier;
  title: string;
  file_path: string;
  file_type?: string;
  status: KnowledgeDocumentStatus;
  created_at: string;
} & Pick<RaRecord, "id">;

export type DocumentChunk = {
  document_id: Identifier;
  content: string;
  chunk_index: number;
} & Pick<RaRecord, "id">;

// =============================================================================
// Bookings
// =============================================================================

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type Booking = {
  conversation_id?: Identifier;
  contact_id?: Identifier;
  sales_id?: Identifier;
  calcom_event_id?: string;
  scheduled_at?: string;
  status: BookingStatus;
  created_at: string;
} & Pick<RaRecord, "id">;

// =============================================================================
// Discovery
// =============================================================================

export type DiscoveryScanStatus = "pending" | "running" | "completed" | "failed";

export type DiscoveryScan = {
  project_id: Identifier;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  target_sectors: string[];
  scoring_criteria: Record<string, unknown>;
  status: DiscoveryScanStatus;
  created_at: string;
  completed_at?: string;
} & Pick<RaRecord, "id">;

export type DiscoveryProspect = {
  scan_id: Identifier;
  project_id: Identifier;
  business_name: string;
  industry?: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  website?: string;
  status: "pending" | "saved" | "dismissed";
  size_employees?: number;
  revenue_estimate?: number;
  key_contacts?: Array<{
    name: string;
    role?: string;
    email?: string;
    phone?: string;
  }>;
  score: number;
  score_explanation?: string;
  source?: string;
  contact_id?: Identifier;
  created_at: string;
} & Pick<RaRecord, "id">;

// =============================================================================
// Campaigns
// =============================================================================

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

// =============================================================================
// Templates
// =============================================================================

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

// =============================================================================
// Communication Log
// =============================================================================

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

// =============================================================================
// Email Accounts (Gmail OAuth)
// =============================================================================

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
