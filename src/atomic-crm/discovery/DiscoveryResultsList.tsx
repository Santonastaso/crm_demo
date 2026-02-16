import {
  List,
  DataTable,
} from "@/components/admin";
import { TopToolbar } from "../layout/TopToolbar";
import { useRecordContext, useDataProvider, useNotify, useRefresh } from "ra-core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

const ScoreBadge = () => {
  const record = useRecordContext();
  if (!record) return null;
  const score = record.score ?? 0;
  const variant = score >= 70 ? "default" : score >= 40 ? "secondary" : "outline";
  return <Badge variant={variant}>{score}/100</Badge>;
};

const AddToCrmButton = () => {
  const record = useRecordContext();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();

  if (!record || record.contact_id) {
    return record?.contact_id ? (
      <Badge variant="outline">In CRM</Badge>
    ) : null;
  }

  const handleAdd = async () => {
    try {
      const { data: contact } = await dataProvider.create("contacts", {
        data: {
          first_name: record.business_name,
          last_name: "",
          status: "cold",
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          has_newsletter: false,
          tags: [],
          email_jsonb: [],
          phone_jsonb: [],
          background: `Discovery Agent: ${record.score_explanation ?? ""}`,
        },
      });

      await dataProvider.update("discovery_prospects", {
        id: record.id,
        data: { contact_id: contact.id },
        previousData: record,
      });

      notify("Prospect added to CRM");
      refresh();
    } catch {
      notify("Failed to add prospect to CRM", { type: "error" });
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleAdd}>
      <UserPlus className="h-3 w-3 mr-1" />
      Add to CRM
    </Button>
  );
};

export const DiscoveryResultsList = () => (
  <List
    resource="discovery_prospects"
    title={false}
    perPage={25}
    sort={{ field: "score", order: "DESC" }}
    actions={<TopToolbar />}
  >
    <DataTable>
      <DataTable.Col source="business_name" label="Business" />
      <DataTable.Col source="industry" label="Industry" />
      <DataTable.Col source="address" label="Address" />
      <DataTable.Col source="size_employees" label="Employees" />
      <DataTable.Col source="score" label="Score">
        <ScoreBadge />
      </DataTable.Col>
      <DataTable.Col source="contact_id" label="CRM">
        <AddToCrmButton />
      </DataTable.Col>
    </DataTable>
  </List>
);
