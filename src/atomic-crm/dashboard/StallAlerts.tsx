import { useGetList } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { differenceInDays } from "date-fns";
import { Link } from "react-router";
import { formatEURCompact } from "@/lib/formatPrice";
import type { Deal } from "../types";

const STALL_THRESHOLD_DAYS = 7;

export const StallAlerts = () => {
  const { data: deals = [] } = useGetList<Deal>("deals", {
    pagination: { page: 1, perPage: 200 },
    sort: { field: "updated_at", order: "ASC" },
    filter: { "archived_at@is": "null" },
  });

  const stalledDeals = deals
    .map((deal) => {
      const enteredAt = deal.stage_entered_at ?? deal.created_at;
      const days = enteredAt
        ? differenceInDays(new Date(), new Date(enteredAt))
        : 0;
      return { ...deal, daysInStage: days };
    })
    .filter((d) => d.daysInStage >= STALL_THRESHOLD_DAYS)
    .sort((a, b) => b.daysInStage - a.daysInStage)
    .slice(0, 5);

  if (stalledDeals.length === 0) return null;

  return (
    <Card>
      <CardHeader className="px-4 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          Stalli Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="space-y-2">
          {stalledDeals.map((deal) => (
            <Link
              key={String(deal.id)}
              to={`/deals/${deal.id}/show`}
              className="flex items-center justify-between py-1.5 hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{deal.name}</p>
                <p className="text-xs text-muted-foreground">
                  {deal.stage} &middot; {formatEURCompact(deal.amount)}
                </p>
              </div>
              <Badge
                variant={deal.daysInStage >= 14 ? "destructive" : "secondary"}
                className="ml-2 shrink-0 text-xs"
              >
                {deal.daysInStage}g
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
