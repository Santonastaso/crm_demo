import {
  ShowBase,
  useShowContext,
  useGetList,
  useNotify,
} from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, Users } from "lucide-react";
import { useInvokeFunction } from "@/atomic-crm/hooks/useInvokeFunction";
import type { Segment, Contact } from "../types";

export const SegmentShow = () => (
  <ShowBase>
    <SegmentShowContent />
  </ShowBase>
);

const SegmentShowContent = () => {
  const { record, isPending } = useShowContext<Segment>();
  const notify = useNotify();
  const { invoke, loading: refreshing } = useInvokeFunction();

  const { data: segmentContacts = [] } = useGetList(
    "segment_contacts",
    {
      pagination: { page: 1, perPage: 500 },
      filter: record?.id ? { segment_id: record.id } : {},
    },
    { enabled: !!record?.id },
  );

  const contactIds = segmentContacts.map(
    (sc: { contact_id: number }) => sc.contact_id,
  );

  const { data: contacts = [] } = useGetList<Contact>(
    "contacts",
    {
      pagination: { page: 1, perPage: 500 },
      filter:
        contactIds.length > 0
          ? { "id@in": `(${contactIds.join(",")})` }
          : { id: -1 },
    },
    { enabled: contactIds.length > 0 },
  );

  if (isPending || !record) return null;

  const handleRefresh = async () => {
    const data = await invoke<{ contact_count?: number }>(
      "segments-refresh",
      { segment_id: record.id },
      { errorMessage: "Failed to refresh segment" },
    );
    if (data !== null) {
      notify(
        `Segment refreshed: ${data?.contact_count ?? 0} contacts matched`,
      );
    }
  };

  return (
    <div className="mt-2 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">{record.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {record.criteria.length} rule
              {record.criteria.length !== 1 ? "s" : ""} &middot;{" "}
              {record.auto_refresh ? "Auto-refresh" : "Manual refresh"}
              {record.last_refreshed_at &&
                ` · Last refreshed ${new Date(record.last_refreshed_at).toLocaleString()}`}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Refresh
          </Button>
        </CardHeader>
      </Card>

      {/* Rules */}
      {record.criteria.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Filter Rules</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {record.criteria.map(
                (
                  rule: { field: string; operator: string; value: unknown },
                  i: number,
                ) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm bg-muted rounded px-3 py-2"
                  >
                    <Badge variant="outline">{rule.field}</Badge>
                    <span className="text-muted-foreground">
                      {rule.operator}
                    </span>
                    <span className="font-medium">{String(rule.value)}</span>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
            <Badge variant="secondary">{contacts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No members yet. Click Refresh to compute membership from rules.
            </p>
          ) : (
            <div className="divide-y">
              {contacts.map((contact) => {
                const email = (contact.email_jsonb ?? [])[0]?.email;
                return (
                  <div
                    key={String(contact.id)}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {contact.first_name} {contact.last_name}
                      </p>
                      {email && (
                        <p className="text-xs text-muted-foreground">
                          {email}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">{contact.status}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
