import { ShowBase, useShowContext, useGetList, useCreate, useNotify, useRefresh } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditButton } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";
import type { Project, PropertyUnit, ProjectPipeline } from "../types";
import { UNIT_STATUS_COLORS } from "../property-units/unitStatus";
import { formatEUR } from "@/lib/formatPrice";

const ProjectUnits = ({ projectId }: { projectId: number }) => {
  const { data: units } = useGetList<PropertyUnit>("property_units", {
    filter: { project_id: projectId },
    sort: { field: "code", order: "ASC" },
    pagination: { page: 1, perPage: 200 },
  });
  const navigate = useNavigate();

  const statusCounts = (units ?? []).reduce<Record<string, number>>((acc, u) => {
    acc[u.status] = (acc[u.status] || 0) + 1;
    return acc;
  }, {});

  const totalValue = (units ?? []).reduce(
    (sum, u) => sum + (Number(u.current_price) || 0),
    0,
  );

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm">Units ({units?.length ?? 0})</CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/property_units/create?source=${encodeURIComponent(JSON.stringify({ project_id: projectId }))}`)}
        >
          Add Unit
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-3 text-sm flex-wrap">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center gap-1">
              <Badge variant={UNIT_STATUS_COLORS[status] ?? "outline"} className="text-xs">{status}</Badge>
              <span className="font-medium">{count}</span>
            </div>
          ))}
          {totalValue > 0 && (
            <div className="text-muted-foreground ml-auto">
              Total: {formatEUR(totalValue)}
            </div>
          )}
        </div>
        {units && units.length > 0 ? (
          <div className="space-y-1">
            {units.map((u) => (
              <div
                key={String(u.id)}
                className="flex items-center justify-between text-sm border rounded px-3 py-1.5 cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/property_units/${u.id}/show`)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">{u.code}</span>
                  <span className="text-muted-foreground">{u.typology}</span>
                  {u.square_meters && <span className="text-muted-foreground">{u.square_meters}m²</span>}
                </div>
                <div className="flex items-center gap-2">
                  {u.current_price && <span>{formatEUR(Number(u.current_price))}</span>}
                  <Badge variant={UNIT_STATUS_COLORS[u.status] ?? "outline"} className="text-xs">{u.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No units added yet.</p>
        )}
      </CardContent>
    </Card>
  );
};

const ProjectPipelineConfig = ({ projectId }: { projectId: number }) => {
  const { data: stages, isLoading } = useGetList<ProjectPipeline>("project_pipelines", {
    filter: { project_id: projectId },
    sort: { field: "stage_order", order: "ASC" },
    pagination: { page: 1, perPage: 50 },
  });
  const notify = useNotify();
  const refresh = useRefresh();
  const [newStage, setNewStage] = useState("");

  const handleAdd = async () => {
    if (!newStage.trim()) return;
    const nextOrder = (stages?.length ?? 0) + 1;
    const { error } = await supabase.from("project_pipelines").insert({
      project_id: projectId,
      stage_name: newStage.trim().toLowerCase(),
      stage_order: nextOrder,
      is_terminal: false,
    });
    if (error) {
      notify("Failed to add stage", { type: "error" });
    } else {
      setNewStage("");
      notify("Stage added");
      refresh();
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("project_pipelines").delete().eq("id", id);
    if (error) {
      notify("Failed to delete stage", { type: "error" });
    } else {
      notify("Stage removed");
      refresh();
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm">Pipeline Stages</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !stages?.length ? (
          <p className="text-sm text-muted-foreground mb-2">
            No custom pipeline. Using default stages.
          </p>
        ) : (
          <div className="space-y-1 mb-3">
            {stages.map((s) => (
              <div
                key={String(s.id)}
                className="flex items-center justify-between border rounded px-3 py-1.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                  <span>{s.stage_name}</span>
                  <span className="text-xs text-muted-foreground">#{s.stage_order}</span>
                  {s.is_terminal && (
                    <Badge variant="secondary" className="text-xs">terminal</Badge>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id as number)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="New stage name"
            value={newStage}
            onChange={(e) => setNewStage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="h-8 text-sm"
          />
          <Button size="sm" variant="outline" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const ProjectShow = () => (
  <ShowBase>
    <ProjectShowContent />
  </ShowBase>
);

const ProjectShowContent = () => {
  const { record, isPending } = useShowContext<Project>();

  if (isPending || !record) return null;

  return (
    <div className="mt-2 max-w-3xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{record.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={record.status === "active" ? "default" : "secondary"}>
              {record.status}
            </Badge>
            <EditButton />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {record.description && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Description</div>
              <div className="text-sm">{record.description}</div>
            </div>
          )}
          {record.location && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Location</div>
              <div className="text-sm">{record.location}</div>
            </div>
          )}
          {(record.location_lat != null && record.location_lng != null) && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Coordinates</div>
              <div className="text-sm">
                {record.location_lat}, {record.location_lng}
              </div>
            </div>
          )}
          <div>
            <div className="text-sm font-medium text-muted-foreground">Slug</div>
            <div className="text-sm font-mono">{record.slug}</div>
          </div>
        </CardContent>
      </Card>

      <ProjectUnits projectId={record.id as number} />
      <ProjectPipelineConfig projectId={record.id as number} />
    </div>
  );
};
