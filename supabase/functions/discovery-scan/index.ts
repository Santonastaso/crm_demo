import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createErrorResponse, createJsonResponse } from "../_shared/utils.ts";
import { requirePost } from "../_shared/requestHandler.ts";

const PLACES_API_NEW = "https://places.googleapis.com/v1/places:searchNearby";

interface ScoringCriteria {
  sector_weight: number;
  size_weight: number;
  proximity_weight: number;
  activity_weight: number;
}

function computeScore(
  place: Record<string, any>,
  criteria: ScoringCriteria,
  centerLat: number,
  centerLng: number,
  targetSectors: string[],
): { score: number; explanation: string } {
  let score = 0;
  const factors: string[] = [];
  const totalWeight =
    (criteria.sector_weight ?? 25) +
    (criteria.size_weight ?? 25) +
    (criteria.proximity_weight ?? 25) +
    (criteria.activity_weight ?? 25);

  // Sector match
  const types = place.types ?? [];
  const sectorMatch = targetSectors.some(
    (s) => types.includes(s) || (place.name ?? "").toLowerCase().includes(s),
  );
  if (sectorMatch) {
    const sectorScore = (criteria.sector_weight / totalWeight) * 100;
    score += sectorScore;
    factors.push(`Sector match (+${Math.round(sectorScore)})`);
  }

  // Size signals from rating count
  const ratingCount = place.user_ratings_total ?? 0;
  let sizeScore = 0;
  if (ratingCount > 500) sizeScore = 1;
  else if (ratingCount > 100) sizeScore = 0.7;
  else if (ratingCount > 20) sizeScore = 0.4;
  else sizeScore = 0.1;
  const sizePoints = sizeScore * (criteria.size_weight / totalWeight) * 100;
  score += sizePoints;
  factors.push(`${ratingCount} reviews, size signal (+${Math.round(sizePoints)})`);

  // Proximity
  const placeLat = place.geometry?.location?.lat ?? centerLat;
  const placeLng = place.geometry?.location?.lng ?? centerLng;
  const distance = haversine(centerLat, centerLng, placeLat, placeLng);
  const proximityScore = Math.max(0, 1 - distance / 50);
  const proximityPoints =
    proximityScore * (criteria.proximity_weight / totalWeight) * 100;
  score += proximityPoints;
  factors.push(
    `${distance.toFixed(1)}km away (+${Math.round(proximityPoints)})`,
  );

  // Activity (rating as proxy)
  const rating = place.rating ?? 0;
  const activityScore = rating / 5;
  const activityPoints =
    activityScore * (criteria.activity_weight / totalWeight) * 100;
  score += activityPoints;
  factors.push(`Rating ${rating}/5 (+${Math.round(activityPoints)})`);

  return {
    score: Math.min(100, Math.round(score)),
    explanation: factors.join(", "),
  };
}

function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req: Request) => {
  const earlyResponse = requirePost(req);
  if (earlyResponse) return earlyResponse;

  const googleApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!googleApiKey) {
    return createErrorResponse(500, "GOOGLE_MAPS_API_KEY not configured");
  }

  const { scan_id } = await req.json();

  if (!scan_id) {
    return createErrorResponse(400, "scan_id is required");
  }

  const { data: scan, error: scanError } = await supabaseAdmin
    .from("discovery_scans")
    .select("*")
    .eq("id", scan_id)
    .single();

  if (!scan || scanError) {
    return createErrorResponse(404, "Scan not found");
  }

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

    const response = await fetch(PLACES_API_NEW, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googleApiKey,
        "X-Goog-FieldMask": "places.displayName,places.types,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.shortFormattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Google Places API error: ${JSON.stringify(data.error ?? data)}`);
    }

    const places: Record<string, any>[] = data.places ?? [];

    // Process and score each place (adapt to new API shape)
    const prospects = places.map(
      (place: Record<string, any>) => {
        const adapted = {
          name: place.displayName?.text ?? "Unknown",
          types: place.types ?? [],
          vicinity: place.shortFormattedAddress ?? place.formattedAddress ?? "",
          geometry: {
            location: {
              lat: place.location?.latitude,
              lng: place.location?.longitude,
            },
          },
          rating: place.rating ?? 0,
          user_ratings_total: place.userRatingCount ?? 0,
        };

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
