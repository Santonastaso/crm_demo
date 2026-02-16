import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CampaignSend } from "../types";

interface CampaignMetricsProps {
  sends: CampaignSend[];
}

export const CampaignMetrics = ({ sends }: CampaignMetricsProps) => {
  const total = sends.length;

  if (total === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-muted-foreground text-center">
            No sends recorded yet. Start the campaign to see metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const countByStatus = (status: string) =>
    sends.filter((s) => s.status === status).length;

  const sent = sends.filter(
    (s) => s.status !== "pending" && s.status !== "failed",
  ).length;
  const delivered = countByStatus("delivered") + countByStatus("opened") + countByStatus("clicked") + countByStatus("replied");
  const opened = countByStatus("opened") + countByStatus("clicked") + countByStatus("replied");
  const clicked = countByStatus("clicked") + countByStatus("replied");
  const replied = countByStatus("replied");
  const bounced = countByStatus("bounced");
  const failed = countByStatus("failed");

  const rate = (n: number, d: number) =>
    d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "0%";

  const metrics = [
    { label: "Total", value: total, rate: null },
    { label: "Sent", value: sent, rate: rate(sent, total) },
    { label: "Delivered", value: delivered, rate: rate(delivered, sent) },
    { label: "Opened", value: opened, rate: rate(opened, delivered) },
    { label: "Clicked", value: clicked, rate: rate(clicked, opened) },
    { label: "Replied", value: replied, rate: rate(replied, sent) },
    { label: "Bounced", value: bounced, rate: rate(bounced, sent) },
    { label: "Failed", value: failed, rate: rate(failed, total) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Campaign Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
              {m.rate !== null && (
                <p className="text-xs font-medium mt-1">{m.rate}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
