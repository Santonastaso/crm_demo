import type { Identifier, RaRecord } from "ra-core";

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
