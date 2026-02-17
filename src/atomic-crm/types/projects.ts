import type { Identifier, RaRecord } from "ra-core";

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
  status: "disponibile" | "proposta" | "compromesso" | "rogito";
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
