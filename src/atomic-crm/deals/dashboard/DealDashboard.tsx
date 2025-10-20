import { useRecordContext } from "ra-core";

import type { Deal } from "../../types";
import { DealMetricsCards } from "./DealMetricsCards";
import { DealStageTimeline } from "./DealStageTimeline";
import { DealInteractionsChart } from "./DealInteractionsChart";

export const DealDashboard = () => {
  const deal = useRecordContext<Deal>();

  if (!deal) return null;

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <DealMetricsCards />

      {/* Stage Timeline */}
      <DealStageTimeline />

      {/* Interactions Chart */}
      <DealInteractionsChart />
    </div>
  );
};
