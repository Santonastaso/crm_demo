import {
  ShowBase,
  useShowContext,
  useGetList,
  useGetOne,
  useNotify,
  useRefresh,
} from "ra-core";
import { ReferenceField, TextField } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, BarChart3, FileText } from "lucide-react";
import type { Campaign, CampaignSend, Template } from "../types";
import { CampaignMetrics } from "./CampaignMetrics";
import { supabase } from "@/atomic-crm/providers/supabase/supabase";

export const CampaignShow = () => (
  <ShowBase>
    <CampaignShowContent />
  </ShowBase>
);

const CampaignShowContent = () => {
  const { record, isPending } = useShowContext<Campaign>();
  const notify = useNotify();
  const refresh = useRefresh();

  const { data: sends = [] } = useGetList<CampaignSend>("campaign_sends", {
    pagination: { page: 1, perPage: 1000 },
    filter: record?.id ? { campaign_id: record.id } : {},
  }, { enabled: !!record?.id });

  if (isPending || !record) return null;

  const handleSend = async () => {
    try {
      const { error } = await supabase.functions.invoke("campaign-send", {
        method: "POST",
        body: { campaign_id: record.id },
      });
      if (error) throw error;
      notify("Campaign sending initiated");
      refresh();
    } catch {
      notify("Failed to start campaign send", { type: "error" });
    }
  };

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
            {(record.status === "draft" || record.status === "scheduled") && (
              <Button size="sm" onClick={handleSend}>
                <Play className="h-4 w-4 mr-1" />
                Send Now
              </Button>
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

      {record.template_id && <TemplatePreview templateId={record.template_id} />}

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
