import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createErrorResponse, createJsonResponse } from "../_shared/utils.ts";
import { requirePost } from "../_shared/requestHandler.ts";
import { parseJsonBody } from "../_shared/parseJsonBody.ts";
import { type SegmentCriterion, buildFilter } from "../_shared/segmentUtils.ts";

Deno.serve(async (req: Request) => {
  const earlyResponse = requirePost(req);
  if (earlyResponse) return earlyResponse;

  const parsed = await parseJsonBody<{ segment_id?: number }>(req);
  if (!parsed.ok) return parsed.response;
  const { segment_id } = parsed.data;

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

  return createJsonResponse({
    segment_id,
    contact_count: contactIds.length,
    refreshed_at: new Date().toISOString(),
  });
});
