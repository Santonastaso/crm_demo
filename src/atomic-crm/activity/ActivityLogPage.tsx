import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { ActivityLog } from "./ActivityLog";

export const ActivityLogPage = () => {
  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="flex items-center mb-6">
        <div className="mr-3 flex">
          <Clock className="text-muted-foreground w-6 h-6" />
        </div>
        <h1 className="text-2xl font-semibold text-muted-foreground">
          Activity Log
        </h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <ActivityLog pageSize={50} />
        </CardContent>
      </Card>
    </div>
  );
};

ActivityLogPage.path = "/activity";
