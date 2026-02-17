import { ReferenceField, TextField } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import type { DiscoveryScan } from "../types";

const scanStatusMap: Record<string, "default" | "destructive" | "outline"> = {
  completed: "default",
  failed: "destructive",
};

export const DiscoveryScanHeader = ({
  record,
  running,
  onRun,
}: {
  record: DiscoveryScan;
  running: boolean;
  onRun: () => void;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle className="text-base">
          Discovery Scan #{String(record.id)}
        </CardTitle>
        <div className="flex items-center gap-2 mt-1">
          {record.project_id && (
            <span className="text-sm text-muted-foreground">
              Project:{" "}
              <ReferenceField
                source="project_id"
                reference="projects"
                link={false}
              >
                <TextField source="name" />
              </ReferenceField>
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={scanStatusMap[record.status] ?? "outline"}>
          {record.status}
        </Badge>
        {(record.status === "pending" || record.status === "failed") && (
          <Button size="sm" onClick={onRun} disabled={running}>
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            {record.status === "failed" ? "Retry" : "Run Scan"}
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Center</span>
          <p>
            {record.center_lat}, {record.center_lng}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Radius</span>
          <p>{record.radius_km} km</p>
        </div>
        <div>
          <span className="text-muted-foreground">Sectors</span>
          <p>{(record.target_sectors ?? []).join(", ") || "All"}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);
