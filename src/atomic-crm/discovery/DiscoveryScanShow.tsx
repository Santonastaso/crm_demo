import { ShowBase, useShowContext } from "ra-core";
import { useInvokeFunction } from "@/atomic-crm/hooks/useInvokeFunction";
import type { DiscoveryScan } from "../types";
import { DiscoveryScanHeader } from "./DiscoveryScanHeader";
import { DiscoveryProspectTable } from "./DiscoveryProspectTable";

export const DiscoveryScanShow = () => (
  <ShowBase>
    <DiscoveryScanShowContent />
  </ShowBase>
);

const DiscoveryScanShowContent = () => {
  const { record, isPending } = useShowContext<DiscoveryScan>();
  const { invoke, loading: running } = useInvokeFunction();

  if (isPending || !record) return null;

  const handleRun = async () => {
    await invoke("discovery-scan", { scan_id: record.id }, {
      successMessage: "Scan completed",
      errorMessage: "Scan failed",
    });
  };

  return (
    <div className="mt-2 max-w-6xl mx-auto space-y-4">
      <DiscoveryScanHeader record={record} running={running} onRun={handleRun} />
      <DiscoveryProspectTable record={record} />
    </div>
  );
};
