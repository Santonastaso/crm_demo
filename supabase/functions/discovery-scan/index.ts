import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createErrorResponse, createJsonResponse } from "../_shared/utils.ts";
import { fetchJson } from "../_shared/fetchJson.ts";
import { requirePost } from "../_shared/requestHandler.ts";
import { parseJsonBody } from "../_shared/parseJsonBody.ts";
import { fetchEntityOr404 } from "../_shared/fetchEntityOr404.ts";
import { type ScoringCriteria, computeScore, adaptPlace } from "../_shared/discoveryUtils.ts";

const PLACES_API_NEW = "https://places.googleapis.com/v1/places:searchNearby";

Deno.serve(async (req: Request) => {
  const earlyResponse = requirePost(req);
  if (earlyResponse) return earlyResponse;

  const googleApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!googleApiKey) {
    return createErrorResponse(500, "GOOGLE_MAPS_API_KEY not configured");
  }

  const parsed = await parseJsonBody<{ scan_id?: number }>(req);
  if (!parsed.ok) return parsed.response;
  const { scan_id } = parsed.data;

  if (!scan_id) {
    return createErrorResponse(400, "scan_id is required");
  }

  const scanResult = await fetchEntityOr404("discovery_scans", scan_id, "Scan");
  if (scanResult.response) return scanResult.response;
  const scan = scanResult.data;

  // Update status to running
  await supabaseAdmin
    .from("discovery_scans")
    .update({ status: "running" })
    .eq("id", scan_id);

  try {
    const radiusMeters = Math.min(scan.radius_km * 1000, 50000);
    const targetSectors: string[] = scan.target_sectors ?? [];
    const raw = scan.scoring_criteria ?? {};
    const criteria: ScoringCriteria = {
      sector_weight: raw.sector_weight ?? 25,
      size_weight: raw.size_weight ?? 25,
      proximity_weight: raw.proximity_weight ?? 25,
      activity_weight: raw.activity_weight ?? 25,
    };

    // Query Google Places API (New)
    const requestBody: Record<string, unknown> = {
      locationRestriction: {
        circle: {
          center: { latitude: scan.center_lat, longitude: scan.center_lng },
          radius: radiusMeters,
        },
      },
      maxResultCount: 20,
    };

    if (targetSectors.length > 0) {
      requestBody.includedTypes = targetSectors;
    }

    interface PlacesApiResponse {
      places?: Record<string, any>[];
      error?: unknown;
    }

    const result = await fetchJson<PlacesApiResponse>(PLACES_API_NEW, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleApiKey,
        "X-Goog-FieldMask": "places.displayName,places.types,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.shortFormattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri",
      },
      body: JSON.stringify(requestBody),
    });

    if (!result.ok) {
      throw new Error(`Google Places API error: ${JSON.stringify(result.data)}`);
    }

    const places: Record<string, any>[] = result.data.places ?? [];

    // Process and score each place
    const prospects = places.map(
      (place: Record<string, any>) => {
        const adapted = adaptPlace(place);

        const { score, explanation } = computeScore(
          adapted,
          criteria,
          scan.center_lat,
          scan.center_lng,
          targetSectors,
        );

        return {
          scan_id,
          project_id: scan.project_id,
          business_name: adapted.name,
          industry: adapted.types.join(", "),
          address: adapted.vicinity,
          lat: adapted.geometry.location.lat,
          lng: adapted.geometry.location.lng,
          phone: place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? null,
          website: place.websiteUri ?? null,
          score,
          score_explanation: explanation,
          source: "google_maps",
          status: "pending",
          key_contacts: [],
        };
      },
    );

    // Insert prospects
    if (prospects.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("discovery_prospects")
        .insert(prospects);

      if (insertError) {
        throw new Error(`Failed to insert prospects: ${insertError.message}`);
      }
    }

    // Update scan status
    await supabaseAdmin
      .from("discovery_scans")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", scan_id);

    return createJsonResponse({
      scan_id,
      prospects_found: prospects.length,
      status: "completed",
    });
  } catch (err) {
    console.error("Discovery scan error:", err);

    await supabaseAdmin
      .from("discovery_scans")
      .update({ status: "failed" })
      .eq("id", scan_id);

    return createErrorResponse(500, `Scan failed: ${(err as Error).message}`);
  }
});
