import { useGetList } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project, PropertyUnit, Deal } from "../types";
import { formatEUR } from "@/lib/formatPrice";
import { useNavigate } from "react-router";

export const TopProjects = () => {
  const { data: projects, isPending: pp } = useGetList<Project>("projects", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "name", order: "ASC" },
    filter: { status: "active" },
  });
  const { data: units, isPending: up } = useGetList<PropertyUnit>("property_units", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "id", order: "ASC" },
  });
  const { data: deals, isPending: dp } = useGetList<Deal>("deals", {
    pagination: { page: 1, perPage: 500 },
    sort: { field: "id", order: "ASC" },
    filter: { "archived_at@is": null },
  });

  const navigate = useNavigate();

  if (pp || up || dp) return null;
  if (!projects || projects.length === 0) return null;

  const projectStats = projects.map((p) => {
    const pUnits = (units ?? []).filter((u) => u.project_id === p.id);
    const soldCount = pUnits.filter((u) => u.status === "rogito").length;
    const pDeals = (deals ?? []).filter((d) => d.project_id === p.id);
    const pipelineValue = pDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
    return { ...p, unitCount: pUnits.length, soldCount, dealCount: pDeals.length, pipelineValue };
  });

  projectStats.sort((a, b) => b.pipelineValue - a.pipelineValue);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Top Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {projectStats.slice(0, 5).map((p) => (
            <div
              key={String(p.id)}
              className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2"
              onClick={() => navigate(`/projects/${p.id}/show`)}
            >
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.unitCount} units · {p.soldCount} sold · {p.dealCount} deals
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatEUR(p.pipelineValue)}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
