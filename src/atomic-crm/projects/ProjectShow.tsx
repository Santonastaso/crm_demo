import { ShowBase, useShowContext } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditButton } from "@/components/admin";
import type { Project } from "../types";

export const ProjectShow = () => (
  <ShowBase>
    <ProjectShowContent />
  </ShowBase>
);

const ProjectShowContent = () => {
  const { record, isPending } = useShowContext<Project>();

  if (isPending || !record) return null;

  return (
    <div className="mt-2 max-w-2xl mx-auto">
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
    </div>
  );
};
