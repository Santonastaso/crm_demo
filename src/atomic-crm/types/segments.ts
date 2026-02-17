import type { Identifier, RaRecord } from "ra-core";

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
