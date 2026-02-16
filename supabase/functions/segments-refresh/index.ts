import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, createErrorResponse } from "../_shared/utils.ts";

interface SegmentCriterion {
  field: string;
  operator: string;
  value: string | number | boolean | string[];
}

const ARRAY_COLUMNS = new Set(["tags"]);

function parseIds(value: string | number | boolean | string[]): number[] {
  if (Array.isArray(value)) return value.map(Number).filter((n) => !isNaN(n));
  const str = String(value);
  return str
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !isNaN(n));
}

function buildFilter(
  query: any,
  criteria: SegmentCriterion[],
) {
  let q = query;
  for (const rule of criteria) {
    // Array columns (e.g. tags bigint[]) need special PostgREST operators
    if (ARRAY_COLUMNS.has(rule.field)) {
      const ids = parseIds(rule.value);
      if (ids.length === 0) continue;
      switch (rule.operator) {
        case "eq":
        case "contains":
          // "has all of these tags" → @> (contains)
          q = q.contains(rule.field, ids);
          break;
        case "in":
          // "has any of these tags" → && (overlaps)
          q = q.overlaps(rule.field, ids);
          break;
        case "neq":
        case "not_in":
          // "does not have any of these tags"
          q = q.not(rule.field, "ov", `{${ids.join(",")}}`);
          break;
        default:
          break;
      }
      continue;
    }

    switch (rule.operator) {
      case "eq":
        q = q.eq(rule.field, rule.value);
        break;
      case "neq":
        q = q.neq(rule.field, rule.value);
        break;
      case "gt":
        q = q.gt(rule.field, rule.value);
        break;
      case "lt":
        q = q.lt(rule.field, rule.value);
        break;
      case "gte":
        q = q.gte(rule.field, rule.value);
        break;
      case "lte":
        q = q.lte(rule.field, rule.value);
        break;
      case "contains":
        q = q.ilike(rule.field, `%${rule.value}%`);
        break;
      case "in":
        q = q.in(
          rule.field,
          Array.isArray(rule.value) ? rule.value : [rule.value],
        );
        break;
      case "not_in": {
        const values = Array.isArray(rule.value) ? rule.value : [rule.value];
        const quoted = values.map((v) =>
          typeof v === "string" ? `"${v.replace(/"/g, '\\"')}"` : String(v),
        );
        q = q.not(rule.field, "in", `(${quoted.join(",")})`);
        break;
      }
    }
  }
  return q;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return createErrorResponse(405, "Method Not Allowed");
  }

  const { segment_id } = await req.json();

  if (!segment_id) {
    return createErrorResponse(400, "segment_id is required");
  }

  const { data: segment, error: segmentError } = await supabaseAdmin
    .from("segments")
    .select("*")
    .eq("id", segment_id)
    .single();

  if (!segment || segmentError) {
    return createErrorResponse(404, "Segment not found");
  }

  const criteria: SegmentCriterion[] = segment.criteria ?? [];

  let contactQuery = supabaseAdmin.from("contacts").select("id");
  contactQuery = buildFilter(contactQuery, criteria);

  const { data: matchingContacts, error: contactError } = await contactQuery;

  if (contactError) {
    console.error("Error querying contacts:", contactError);
    return createErrorResponse(500, "Failed to query contacts");
  }

  const contactIds = (matchingContacts ?? []).map((c: { id: number }) => c.id);

  // Clear existing membership
  await supabaseAdmin
    .from("segment_contacts")
    .delete()
    .eq("segment_id", segment_id);

  // Insert new membership
  if (contactIds.length > 0) {
    const rows = contactIds.map((contact_id: number) => ({
      segment_id,
      contact_id,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("segment_contacts")
      .insert(rows);

    if (insertError) {
      console.error("Error inserting segment_contacts:", insertError);
      return createErrorResponse(500, "Failed to refresh segment membership");
    }
  }

  // Update last_refreshed_at
  await supabaseAdmin
    .from("segments")
    .update({ last_refreshed_at: new Date().toISOString() })
    .eq("id", segment_id);

  return new Response(
    JSON.stringify({
      segment_id,
      contact_count: contactIds.length,
      refreshed_at: new Date().toISOString(),
    }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    },
  );
});
