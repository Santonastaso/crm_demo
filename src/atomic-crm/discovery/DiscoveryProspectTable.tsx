import {
  useNotify,
  useRefresh,
  useGetList,
  useGetIdentity,
  useDataProvider,
} from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  UserPlus,
  Check,
  X,
  ExternalLink,
  Phone,
  Globe,
} from "lucide-react";
import { useState, useCallback } from "react";
import type { DiscoveryScan, DiscoveryProspect } from "../types";

type StatusTab = "pending" | "saved" | "dismissed" | "all";

export const DiscoveryProspectTable = ({
  record,
}: {
  record: DiscoveryScan;
}) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const { data: identity } = useGetIdentity();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<StatusTab>("pending");
  const [bulkLoading, setBulkLoading] = useState(false);

  const { data: allProspects = [] } = useGetList<DiscoveryProspect>(
    "discovery_prospects",
    {
      pagination: { page: 1, perPage: 200 },
      sort: { field: "score", order: "DESC" },
      filter: { scan_id: record.id },
    },
    { enabled: !!record.id },
  );

  const prospects =
    activeTab === "all"
      ? allProspects
      : allProspects.filter((p) => p.status === activeTab);

  const counts = {
    all: allProspects.length,
    pending: allProspects.filter((p) => p.status === "pending").length,
    saved: allProspects.filter((p) => p.status === "saved").length,
    dismissed: allProspects.filter((p) => p.status === "dismissed").length,
  };

  const toggleSelect = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selected.size === prospects.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(prospects.map((p) => Number(p.id))));
    }
  }, [prospects, selected.size]);

  const batchUpdateStatus = useCallback(
    async (newStatus: "saved" | "dismissed") => {
      if (selected.size === 0) return;
      setBulkLoading(true);
      try {
        const ids = Array.from(selected);

        if (newStatus === "saved") {
          for (const id of ids) {
            const prospect = allProspects.find((p) => Number(p.id) === id);
            if (!prospect || prospect.contact_id) continue;

            const phoneEntries = prospect.phone
              ? [{ number: prospect.phone, type: "work" }]
              : [];

            const { data: contact } = await dataProvider.create("contacts", {
              data: {
                first_name: prospect.business_name,
                last_name: "",
                status: "cold",
                sales_id: identity?.id ?? null,
                first_seen: new Date().toISOString(),
                last_seen: new Date().toISOString(),
                has_newsletter: false,
                tags: [],
                email_jsonb: [],
                phone_jsonb: phoneEntries,
                background: `Discovery Agent: ${prospect.score_explanation ?? ""}${prospect.website ? `\nWebsite: ${prospect.website}` : ""}`,
                source: "discovery",
              },
            });

            await dataProvider.update("discovery_prospects", {
              id,
              data: { status: "saved", contact_id: contact.id },
              previousData: { id },
            });
          }
          notify(
            `${ids.length} prospect${ids.length > 1 ? "s" : ""} saved to CRM`,
          );
        } else {
          for (const id of ids) {
            await dataProvider.update("discovery_prospects", {
              id,
              data: { status: newStatus },
              previousData: { id },
            });
          }
          notify(
            `${ids.length} prospect${ids.length > 1 ? "s" : ""} dismissed`,
          );
        }

        setSelected(new Set());
        refresh();
      } catch {
        notify("Failed to update prospects", { type: "error" });
      } finally {
        setBulkLoading(false);
      }
    },
    [selected, allProspects, dataProvider, notify, refresh, identity],
  );

  const tabs: { key: StatusTab; label: string }[] = [
    { key: "pending", label: `Pending (${counts.pending})` },
    { key: "saved", label: `Saved (${counts.saved})` },
    { key: "dismissed", label: `Dismissed (${counts.dismissed})` },
    { key: "all", label: `All (${counts.all})` },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Prospects</CardTitle>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selected.size} selected
              </span>
              <Button
                size="sm"
                onClick={() => batchUpdateStatus("saved")}
                disabled={bulkLoading}
              >
                {bulkLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Save Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => batchUpdateStatus("dismissed")}
                disabled={bulkLoading}
              >
                <X className="h-3 w-3 mr-1" />
                Dismiss Selected
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-1 mt-2 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSelected(new Set());
              }}
              className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {prospects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            {record.status === "pending"
              ? "Run the scan to find prospects."
              : record.status === "running"
                ? "Scan is running..."
                : `No ${activeTab === "all" ? "" : activeTab + " "}prospects.`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-2 w-8">
                    <input
                      type="checkbox"
                      checked={
                        selected.size > 0 &&
                        selected.size === prospects.length
                      }
                      onChange={toggleAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="pb-2 pr-4">Business</th>
                  <th className="pb-2 pr-4">Industry</th>
                  <th className="pb-2 pr-4">Address</th>
                  <th className="pb-2 pr-4">Phone</th>
                  <th className="pb-2 pr-4">Website</th>
                  <th className="pb-2 pr-4">Score</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((prospect) => (
                  <ProspectRow
                    key={String(prospect.id)}
                    prospect={prospect}
                    isSelected={selected.has(Number(prospect.id))}
                    onToggle={() => toggleSelect(Number(prospect.id))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ProspectRow = ({
  prospect,
  isSelected,
  onToggle,
}: {
  prospect: DiscoveryProspect;
  isSelected: boolean;
  onToggle: () => void;
}) => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();
  const { data: identity } = useGetIdentity();
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try {
      const phoneEntries = prospect.phone
        ? [{ number: prospect.phone, type: "work" }]
        : [];

      const { data: contact } = await dataProvider.create("contacts", {
        data: {
          first_name: prospect.business_name,
          last_name: "",
          status: "cold",
          sales_id: identity?.id ?? null,
          first_seen: new Date().toISOString(),
          last_seen: new Date().toISOString(),
          has_newsletter: false,
          tags: [],
          email_jsonb: [],
          phone_jsonb: phoneEntries,
          background: `Discovery Agent: ${prospect.score_explanation ?? ""}${prospect.website ? `\nWebsite: ${prospect.website}` : ""}`,
          source: "discovery",
        },
      });

      await dataProvider.update("discovery_prospects", {
        id: prospect.id,
        data: { contact_id: contact.id, status: "saved" },
        previousData: prospect,
      });

      notify("Prospect added to CRM");
      refresh();
    } catch {
      notify("Failed to add prospect", { type: "error" });
    } finally {
      setAdding(false);
    }
  };

  const score = prospect.score ?? 0;
  const scoreVariant =
    score >= 70 ? "default" : score >= 40 ? "secondary" : "outline";

  const statusVariant =
    prospect.status === "saved"
      ? "default"
      : prospect.status === "dismissed"
        ? "destructive"
        : "secondary";

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="py-2 pr-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="rounded border-gray-300"
        />
      </td>
      <td className="py-2 pr-4 font-medium">{prospect.business_name}</td>
      <td className="py-2 pr-4 text-muted-foreground text-xs max-w-32 truncate">
        {prospect.industry}
      </td>
      <td className="py-2 pr-4 text-muted-foreground text-xs max-w-40 truncate">
        {prospect.address}
      </td>
      <td className="py-2 pr-4 text-xs">
        {prospect.phone ? (
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3 text-muted-foreground" />
            {prospect.phone}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="py-2 pr-4 text-xs">
        {prospect.website ? (
          <a
            href={prospect.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Globe className="h-3 w-3" />
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="py-2 pr-4">
        <Badge variant={scoreVariant}>{score}/100</Badge>
      </td>
      <td className="py-2 pr-4">
        <Badge variant={statusVariant} className="text-xs">
          {prospect.status}
        </Badge>
      </td>
      <td className="py-2">
        {prospect.contact_id ? (
          <Badge variant="outline">In CRM</Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <UserPlus className="h-3 w-3 mr-1" />
            )}
            Add to CRM
          </Button>
        )}
      </td>
    </tr>
  );
};
