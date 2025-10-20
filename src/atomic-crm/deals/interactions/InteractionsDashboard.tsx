import { useRecordContext, useGetList } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays, differenceInWeeks } from "date-fns";
import type { Deal, DealInteraction } from "../../types";

export const InteractionsDashboard = () => {
  const record = useRecordContext<Deal>();
  const { data: interactions, isPending } = useGetList<DealInteraction>(
    "dealInteractions",
    {
      filter: { deal_id: record?.id },
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "date", order: "DESC" },
    },
    { enabled: !!record }
  );

  if (!record) return null;
  if (isPending) return <div>Loading dashboard...</div>;

  const totalInteractions = interactions?.length || 0;
  
  // Calculate time in pipeline
  const daysInPipeline = differenceInDays(
    new Date(),
    new Date(record.created_at)
  );
  
  // Calculate average interactions per week
  const weeksInPipeline = Math.max(differenceInWeeks(new Date(), new Date(record.created_at)), 1);
  const avgInteractionsPerWeek = (totalInteractions / weeksInPipeline).toFixed(1);

  // Most common interaction type
  const typeCounts: Record<string, number> = {};
  interactions?.forEach((interaction) => {
    typeCounts[interaction.type] = (typeCounts[interaction.type] || 0) + 1;
  });
  const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

  // Sentiment distribution
  const sentimentCounts: Record<string, number> = {
    Positivo: 0,
    Neutro: 0,
    Negativo: 0,
    Critico: 0,
  };
  interactions?.forEach((interaction) => {
    if (interaction.sentiment) {
      sentimentCounts[interaction.sentiment] =
        (sentimentCounts[interaction.sentiment] || 0) + 1;
    }
  });

  const totalWithSentiment = Object.values(sentimentCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="font-semibold text-lg">Deal Dashboard</div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deal Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {record.amount.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Days in Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysInPipeline}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Since {new Date(record.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Interactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInteractions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg {avgInteractionsPerWeek} per week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{record.stage}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Updated {differenceInDays(new Date(), new Date(record.updated_at))} days ago
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interaction Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interaction Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {totalInteractions === 0 ? (
              <p className="text-sm text-muted-foreground">
                No interactions recorded yet
              </p>
            ) : (
              <>
                <div className="text-sm">
                  <span className="font-medium">Most Common Type:</span>{" "}
                  {mostCommonType ? (
                    <>
                      {mostCommonType[0]} ({mostCommonType[1]} times)
                    </>
                  ) : (
                    "N/A"
                  )}
                </div>
                <div className="space-y-1 mt-3">
                  {Object.entries(typeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <div
                        key={type}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground">{type}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {totalWithSentiment === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sentiment data recorded yet
              </p>
            ) : (
              <div className="space-y-2">
                {Object.entries(sentimentCounts).map(([sentiment, count]) => {
                  const percentage =
                    totalWithSentiment > 0
                      ? ((count / totalWithSentiment) * 100).toFixed(0)
                      : 0;
                  return (
                    <div key={sentiment} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{sentiment}</span>
                        <span className="font-medium">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            sentiment === "Positivo"
                              ? "bg-green-500"
                              : sentiment === "Neutro"
                                ? "bg-gray-500"
                                : sentiment === "Negativo"
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

