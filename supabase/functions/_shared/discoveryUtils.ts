export interface ScoringCriteria {
  sector_weight: number;
  size_weight: number;
  proximity_weight: number;
  activity_weight: number;
}

/** Haversine distance in kilometres between two coordinates */
export function haversine(
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

/** Score a place against the scan criteria */
export function computeScore(
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

/** Adapt a Google Places API (New) place to the shape expected by computeScore */
export function adaptPlace(place: Record<string, any>): Record<string, any> {
  return {
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
}
