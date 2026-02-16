import { useGetList } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Deal } from "../types";
import { formatEUR } from "@/lib/formatPrice";

export const PipelineValue = () => {
  const { dealStages } = useConfigurationContext();
  const { data: deals, isPending } = useGetList<Deal>("deals", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "id", order: "ASC" },
    filter: { "archived_at@is": null },
  });

  if (isPending) return null;
  if (!deals || deals.length === 0) return null;

  const byStage = dealStages.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage.value);
    const total = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    return { label: stage.label, value: stage.value, count: stageDeals.length, total };
  });

  const grandTotal = deals.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Pipeline Value
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold">{formatEUR(grandTotal)}</div>
        <div className="text-xs text-muted-foreground mb-2">{deals.length} active deals</div>
        <div className="space-y-1.5">
          {byStage
            .filter((s) => s.count > 0)
            .map((s) => (
              <div key={s.value} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium">
                  {s.count} — {formatEUR(s.total)}
                </span>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};
