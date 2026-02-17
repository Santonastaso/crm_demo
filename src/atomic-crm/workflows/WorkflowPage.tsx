import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { WorkflowIcon, Trash2 } from "lucide-react";
import {
  useGetList,
  useCreate,
  useUpdate,
  useDelete,
  useGetIdentity,
  useNotify,
  useRefresh,
} from "ra-core";
import type { Workflow } from "./types";
import { WorkflowCreateDialog } from "./WorkflowCreateDialog";

export const WorkflowPage = () => {
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const refresh = useRefresh();
  const [create] = useCreate();
  const [update] = useUpdate();
  const [deleteOne] = useDelete();

  const { data: workflows = [], isPending } = useGetList<Workflow>("workflows", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "created_at", order: "DESC" },
  });

  const toggleWorkflow = (workflow: Workflow) => {
    update(
      "workflows",
      {
        id: workflow.id,
        data: { enabled: !workflow.enabled },
        previousData: workflow,
      },
      {
        onSuccess: () => {
          refresh();
        },
      },
    );
  };

  const handleDelete = (workflow: Workflow) => {
    deleteOne(
      "workflows",
      { id: workflow.id, previousData: workflow },
      {
        onSuccess: () => {
          notify("Workflow deleted");
          refresh();
        },
      },
    );
  };

  const createWorkflow = (
    workflowData: Omit<Workflow, "id" | "created_at" | "sales_id">,
  ) => {
    create(
      "workflows",
      {
        data: {
          ...workflowData,
          sales_id: identity?.id,
        },
      },
      {
        onSuccess: () => {
          notify("Workflow created");
          refresh();
        },
      },
    );
  };

  if (isPending) {
    return (
      <div className="max-w-4xl mx-auto mt-8">
        <div className="text-center text-muted-foreground py-8">Loading workflows...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="mr-3 flex">
            <WorkflowIcon className="text-muted-foreground w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-muted-foreground">
            Workflows
          </h1>
        </div>
        <WorkflowCreateDialog onCreateWorkflow={createWorkflow} />
      </div>

      <div className="space-y-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <Badge variant={workflow.enabled ? "default" : "secondary"}>
                    {workflow.enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={workflow.enabled}
                    onCheckedChange={() => toggleWorkflow(workflow)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(workflow)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {workflow.description}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">When:</span> Deal stage changes
                  to &quot;{workflow.trigger.stage}&quot;
                </div>
                <div>
                  <span className="font-medium">Then:</span> Create &quot;
                  {workflow.action.taskType}&quot; task
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {workflows.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <WorkflowIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first workflow to automate repetitive tasks
              </p>
              <WorkflowCreateDialog onCreateWorkflow={createWorkflow} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

WorkflowPage.path = "/workflows";
