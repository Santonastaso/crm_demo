import { ShowBase, useShowContext, useGetList } from "ra-core";
import { useInvokeFunction } from "@/atomic-crm/hooks/useInvokeFunction";
import type { DiscoveryScan, DiscoveryProspect } from "../types";
import { DiscoveryScanHeader } from "./DiscoveryScanHeader";
import { DiscoveryProspectTable } from "./DiscoveryProspectTable";
import { lazy, Suspense } from "react";

const MapField = lazy(() =>
  import("../misc/MapField").then((m) => ({ default: m.MapField })),
);

export const DiscoveryScanShow = () => (
  <ShowBase>
    <DiscoveryScanShowContent />
  </ShowBase>
);

const DiscoveryScanShowContent = () => {
  const { record, isPending } = useShowContext<DiscoveryScan>();
  const { invoke, loading: running } = useInvokeFunction();

  const { data: prospects = [] } = useGetList<DiscoveryProspect>(
    "discovery_prospects",
    {
      pagination: { page: 1, perPage: 200 },
      sort: { field: "score", order: "DESC" },
      filter: record?.id ? { scan_id: record.id } : {},
    },
    { enabled: !!record?.id },
  );

  if (isPending || !record) return null;

  const handleRun = async () => {
    await invoke("discovery-scan", { scan_id: record.id }, {
      successMessage: "Scan completed",
      errorMessage: "Scan failed",
    });
  };

  const hasCoords = record.center_lat != null && record.center_lng != null;
  const mapMarkers = prospects
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({
      lat: Number(p.lat),
      lng: Number(p.lng),
      label: p.business_name,
      popup: `${p.business_name} (Score: ${p.score ?? 0}/100)`,
    }));

  return (
    <div className="mt-2 max-w-6xl mx-auto space-y-4">
      <DiscoveryScanHeader record={record} running={running} onRun={handleRun} />
      {hasCoords && (
        <Suspense fallback={<div className="h-[350px] bg-muted animate-pulse rounded-lg" />}>
          <MapField
            center={[Number(record.center_lat), Number(record.center_lng)]}
            zoom={12}
            markers={mapMarkers}
            radiusMeters={(record.radius_km ?? 5) * 1000}
            height="350px"
          />
        </Suspense>
      )}
      <DiscoveryProspectTable record={record} />
    </div>
  );
};
