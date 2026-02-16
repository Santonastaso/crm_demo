import { useGetList } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PropertyUnit } from "../types";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  disponibile: "default",
  opzionato: "secondary",
  compromesso: "outline",
  rogitato: "destructive",
};

export const PortfolioOverview = () => {
  const { data: units, isPending } = useGetList<PropertyUnit>("property_units", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "id", order: "ASC" },
  });

  if (isPending) return null;
  if (!units || units.length === 0) return null;

  const byStatus = units.reduce<Record<string, number>>((acc, u) => {
    acc[u.status] = (acc[u.status] || 0) + 1;
    return acc;
  }, {});

  const totalValue = units.reduce(
    (sum, u) => sum + (Number(u.current_price) || 0),
    0,
  );

  const disponibili = byStatus["disponibile"] || 0;
  const venduti = byStatus["rogitato"] || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold">{units.length} units</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(byStatus).map(([status, count]) => (
            <div key={status} className="flex items-center gap-1">
              <Badge variant={STATUS_COLORS[status] ?? "outline"} className="text-xs">
                {status}
              </Badge>
              <span className="text-sm font-medium">{count}</span>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Value</span>
            <span className="font-medium">€{totalValue.toLocaleString("it-IT")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Available</span>
            <span className="font-medium">{disponibili}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sold</span>
            <span className="font-medium">{venduti}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
