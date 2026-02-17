import {
  ShowBase,
  useShowContext,
  useGetList,
  useGetOne,
  useRedirect,
  useCreate,
  useDelete,
  useNotify,
  useRefresh,
} from "ra-core";
import { ReferenceField, TextField } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pencil, FileText, Plus } from "lucide-react";
import type { Campaign, CampaignSend, CampaignStep, Template } from "../types";
import { CampaignMetrics } from "./CampaignMetrics";
import { CampaignStepDisplay, CampaignStepBuilder } from "./CampaignStepBuilder";
import { useInvokeFunction } from "@/atomic-crm/hooks/useInvokeFunction";
import { useState } from "react";

export const CampaignShow = () => (
  <ShowBase>
    <CampaignShowContent />
  </ShowBase>
);

const CampaignShowContent = () => {
  const { record, isPending } = useShowContext<Campaign>();
  const redirect = useRedirect();
  const { invoke } = useInvokeFunction();
  const [create] = useCreate();
  const [deleteOne] = useDelete();
  const notify = useNotify();
  const refresh = useRefresh();
  const [showAddStep, setShowAddStep] = useState(false);

  const { data: sends = [] } = useGetList<CampaignSend>("campaign_sends", {
    pagination: { page: 1, perPage: 1000 },
    filter: record?.id ? { campaign_id: record.id } : {},
  }, { enabled: !!record?.id });

  const { data: steps = [] } = useGetList<CampaignStep>("campaign_steps", {
    pagination: { page: 1, perPage: 20 },
    sort: { field: "step_order", order: "ASC" },
    filter: record?.id ? { campaign_id: record.id } : {},
  }, { enabled: !!record?.id });

  if (isPending || !record) return null;

  const handleSend = () => {
    invoke("campaign-send", { campaign_id: record.id }, {
      successMessage: "Campaign sending initiated",
      errorMessage: "Failed to start campaign send",
    });
  };

  const handleAddSteps = (newSteps: Array<{
    step_order: number;
    channel: string;
    template_content: { subject: string; body: string };
    delay_hours: number;
    condition: string;
  }>) => {
    const stepsToCreate = newSteps.filter((s) => s.template_content.body.trim());
    if (stepsToCreate.length === 0) return;

    const maxOrder = Math.max(0, ...steps.map((s) => s.step_order));

    Promise.all(
      stepsToCreate.map((s, i) =>
        create("campaign_steps", {
          data: {
            campaign_id: record.id,
            step_order: maxOrder + i + 1,
            channel: s.channel,
            template_content: s.template_content,
            delay_hours: s.delay_hours,
            condition: { type: s.condition },
          },
        }),
      ),
    ).then(() => {
      notify("Steps added");
      setShowAddStep(false);
      refresh();
    });
  };

  const canEdit = record.status === "draft" || record.status === "scheduled";

  return (
    <div className="mt-2 max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{record.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {record.channel} campaign
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                record.status === "completed"
                  ? "default"
                  : record.status === "sending"
                    ? "secondary"
                    : "outline"
              }
            >
              {record.status}
            </Badge>
            {canEdit && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => redirect("edit", "campaigns", record.id)}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" onClick={handleSend}>
                  <Play className="h-4 w-4 mr-1" />
                  Send Now
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {record.segment_id && (
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground">Segment:</span>
              <ReferenceField source="segment_id" reference="segments" link={false}>
                <TextField source="name" />
              </ReferenceField>
            </div>
          )}
          {record.template_id && (
            <div className="flex gap-2 items-center">
              <span className="text-sm font-medium text-muted-foreground">Template:</span>
              <ReferenceField source="template_id" reference="templates" link={false}>
                <TextField source="name" />
              </ReferenceField>
            </div>
          )}
        </CardContent>
      </Card>

      {steps.length > 0 && <CampaignStepDisplay steps={steps} />}

      {canEdit && (
        <div>
          {showAddStep ? (
            <div className="space-y-3">
              <CampaignStepBuilder onStepsChange={handleAddSteps} />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddStep(false)}
                >
                  Annulla
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddStep(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              Aggiungi Step alla Sequenza
            </Button>
          )}
        </div>
      )}

      {record.template_id && steps.length === 0 && (
        <TemplatePreview templateId={record.template_id} />
      )}

      <CampaignMetrics sends={sends} />
    </div>
  );
};

const TemplatePreview = ({ templateId }: { templateId: number }) => {
  const { data: template, isPending } = useGetOne<Template>("templates", { id: templateId });

  if (isPending || !template) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <FileText className="h-4 w-4" />
        <CardTitle className="text-base">Message Preview</CardTitle>
        <Badge variant="outline" className="ml-auto">{template.channel}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {template.subject && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Subject</span>
            <p className="text-sm">{template.subject}</p>
          </div>
        )}
        <div>
          <span className="text-xs font-medium text-muted-foreground">Body</span>
          <pre className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md mt-1">
            {template.body}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};
