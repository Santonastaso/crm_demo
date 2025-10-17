import { ResponsiveBar } from "@nivo/bar";
import { startOfWeek, format, differenceInDays, parseISO } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useGetList, useRecordContext } from "ra-core";
import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Deal, DealInteraction } from "../../types";

export const DealInteractionsChart = () => {
  const deal = useRecordContext<Deal>();
  
  const { data: interactions, isPending } = useGetList<DealInteraction>('dealInteractions', {
    filter: { deal_id: deal?.id },
    pagination: { page: 1, perPage: 1000 },
    sort: { field: 'date', order: 'ASC' },
  });

  const chartData = useMemo(() => {
    if (!interactions || interactions.length === 0) return [];

    // Group interactions by week
    const interactionsByWeek: Record<string, DealInteraction[]> = {};
    
    interactions.forEach((interaction) => {
      const weekStart = startOfWeek(parseISO(interaction.date));
      const weekKey = format(weekStart, "MMM d");
      
      if (!interactionsByWeek[weekKey]) {
        interactionsByWeek[weekKey] = [];
      }
      interactionsByWeek[weekKey].push(interaction);
    });

    return Object.entries(interactionsByWeek).map(([week, items]) => ({
      week,
      count: items.length,
      weekDate: startOfWeek(parseISO(items[0].date)),
    }));
  }, [interactions]);

  const trend = useMemo(() => {
    if (chartData.length < 2) return 'stable';
    
    const recentCount = chartData[chartData.length - 1].count;
    const previousCount = chartData[chartData.length - 2].count;
    
    if (recentCount > previousCount) return 'increasing';
    if (recentCount < previousCount) return 'decreasing';
    return 'stable';
  }, [chartData]);

  const inactivityPeriods = useMemo(() => {
    if (!interactions || interactions.length < 2) return [];
    
    const gaps: { start: string; end: string; days: number }[] = [];
    
    for (let i = 1; i < interactions.length; i++) {
      const days = differenceInDays(
        parseISO(interactions[i].date),
        parseISO(interactions[i - 1].date)
      );
      
      if (days > 7) {
        gaps.push({
          start: interactions[i - 1].date,
          end: interactions[i].date,
          days,
        });
      }
    }
    
    return gaps;
  }, [interactions]);

  if (!deal) return null;

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Frequenza Interazioni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!interactions || interactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Frequenza Interazioni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Nessuna interazione da visualizzare</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Frequenza Interazioni</span>
          <div className="flex items-center gap-2 text-sm font-normal">
            {trend === 'increasing' && (
              <>
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-green-500">In aumento</span>
              </>
            )}
            {trend === 'decreasing' && (
              <>
                <TrendingDown className="h-4 w-4 text-orange-500" />
                <span className="text-orange-500">In diminuzione</span>
              </>
            )}
            {trend === 'stable' && (
              <>
                <Minus className="h-4 w-4 text-gray-500" />
                <span className="text-gray-500">Stabile</span>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveBar
            data={chartData}
            keys={['count']}
            indexBy="week"
            margin={{ top: 20, right: 20, bottom: 50, left: 40 }}
            padding={0.3}
            colors={['#3b82f6']}
            borderRadius={4}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: 'Settimana',
              legendPosition: 'middle',
              legendOffset: 42,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Numero Interazioni',
              legendPosition: 'middle',
              legendOffset: -35,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor="#ffffff"
            tooltip={({ indexValue, value }) => (
              <div className="bg-popover text-popover-foreground px-3 py-2 rounded shadow-lg border">
                <strong>{indexValue}</strong>
                <br />
                {value} interazioni
              </div>
            )}
          />
        </div>

        {inactivityPeriods.length > 0 && (
          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">
              ⚠️ Periodi di inattività rilevati
            </p>
            <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1">
              {inactivityPeriods.slice(0, 3).map((gap, index) => (
                <li key={index}>
                  {gap.days} giorni tra {format(parseISO(gap.start), "PP")} e{" "}
                  {format(parseISO(gap.end), "PP")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};


