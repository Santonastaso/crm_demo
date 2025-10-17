import { differenceInDays } from "date-fns";
import { DollarSign, Percent, Clock, MessageSquare } from "lucide-react";
import { useGetList, useRecordContext } from "ra-core";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Deal, DealInteraction } from "../../types";

const stageMultipliers: Record<string, number> = {
  opportunity: 20,
  "proposal-sent": 50,
  "in-negociation": 80,
  won: 100,
  lost: 0,
  delayed: 30,
};

export const DealMetricsCards = () => {
  const deal = useRecordContext<Deal>();
  
  const { data: interactions } = useGetList<DealInteraction>('dealInteractions', {
    filter: { deal_id: deal?.id },
    pagination: { page: 1, perPage: 1000 },
  });

  if (!deal) return null;

  const probability = stageMultipliers[deal.stage] || 0;
  const daysInPipeline = differenceInDays(new Date(), new Date(deal.created_at));
  const interactionsCount = interactions?.length || 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Deal Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valore Opportunità</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {deal.amount.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Valore previsto del deal
          </p>
        </CardContent>
      </Card>

      {/* Probability */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Probabilità di Chiusura</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{probability}%</div>
          <Progress value={probability} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Basato sullo stage corrente
          </p>
        </CardContent>
      </Card>

      {/* Days in Pipeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Giorni in Pipeline</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{daysInPipeline}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Dal {new Date(deal.created_at).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      {/* Total Interactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Interazioni Totali</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{interactionsCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {interactionsCount === 0 
              ? 'Nessuna interazione registrata'
              : `Ultima: ${interactions && interactions.length > 0 
                  ? new Date(interactions[0].date).toLocaleDateString()
                  : '-'}`
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};


