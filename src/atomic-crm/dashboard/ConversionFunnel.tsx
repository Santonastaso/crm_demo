import { useGetList } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Contact, Deal } from "../types";
import { useConfigurationContext } from "../root/ConfigurationContext";

const LEAD_TYPES = [
  { id: "investitore", label: "Investitore" },
  { id: "prima_casa", label: "Prima Casa" },
  { id: "upgrade", label: "Upgrade" },
  { id: "secondo_immobile", label: "Secondo Immobile" },
];

export const ConversionFunnel = () => {
  const { dealStages } = useConfigurationContext();
  const { data: contacts, isPending: cp } = useGetList<Contact>("contacts_summary", {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: "id", order: "ASC" },
  });
  const { data: deals, isPending: dp } = useGetList<Deal>("deals", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "id", order: "ASC" },
    filter: { "archived_at@is": null },
  });

  if (cp || dp) return null;
  if (!contacts || !deals) return null;

  const leadTypeCounts = LEAD_TYPES.map((lt) => ({
    ...lt,
    count: contacts.filter((c) => c.lead_type === lt.id).length,
  })).filter((lt) => lt.count > 0);

  const stageCounts = dealStages.map((s) => ({
    label: s.label,
    count: deals.filter((d) => d.stage === s.value).length,
  }));

  const totalContacts = contacts.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Contacts by Lead Type
          </div>
          {leadTypeCounts.length > 0 ? (
            leadTypeCounts.map((lt) => (
              <div key={lt.id} className="flex justify-between text-sm">
                <span>{lt.label}</span>
                <span className="font-medium">{lt.count}</span>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No lead types assigned yet</div>
          )}
          <div className="flex justify-between text-sm font-medium pt-1 border-t">
            <span>Total Contacts</span>
            <span>{totalContacts}</span>
          </div>
        </div>

        <div className="space-y-1 pt-2">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Deals by Stage
          </div>
          {stageCounts
            .filter((s) => s.count > 0)
            .map((s) => {
              const pct = totalContacts > 0 ? ((s.count / totalContacts) * 100).toFixed(0) : "0";
              return (
                <div key={s.label} className="flex justify-between text-sm">
                  <span>{s.label}</span>
                  <span className="font-medium">
                    {s.count}{" "}
                    <span className="text-muted-foreground text-xs">({pct}%)</span>
                  </span>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
};
