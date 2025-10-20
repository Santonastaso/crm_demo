import { format } from "date-fns";
import { Check, Circle } from "lucide-react";
import { useRecordContext } from "ra-core";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfigurationContext } from "../../root/ConfigurationContext";
import type { Deal } from "../../types";

export const DealStageTimeline = () => {
  const deal = useRecordContext<Deal>();
  const { dealStages } = useConfigurationContext();

  if (!deal) return null;

  // Find current stage index
  const currentStageIndex = dealStages.findIndex(
    (stage) => stage.value === deal.stage,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline Stage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />

          <div className="relative flex justify-between">
            {dealStages.map((stage, index) => {
              const isCompleted = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;

              return (
                <div
                  key={stage.value}
                  className="flex flex-col items-center flex-1"
                >
                  <div
                    className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <p
                      className={`text-sm font-medium ${
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {stage.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(deal.updated_at), "PP")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Creato:</span>
              <span className="ml-2 font-medium">
                {format(new Date(deal.created_at), "PPP")}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">
                Ultimo aggiornamento:
              </span>
              <span className="ml-2 font-medium">
                {format(new Date(deal.updated_at), "PPP")}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
