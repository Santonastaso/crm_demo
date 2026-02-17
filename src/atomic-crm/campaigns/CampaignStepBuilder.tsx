import { useState } from "react";
import { useGetList } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, ArrowDown } from "lucide-react";
import type { CampaignStep } from "../types";

type StepDraft = {
  step_order: number;
  channel: string;
  template_content: { subject: string; body: string };
  delay_hours: number;
  condition: string;
};

const CHANNEL_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
];

const CONDITION_OPTIONS = [
  { value: "always", label: "Sempre (tutti i contatti)" },
  { value: "if_not_opened", label: "Se non ha aperto (step precedente)" },
  { value: "if_opened", label: "Se ha aperto (step precedente)" },
  { value: "if_not_clicked", label: "Se non ha cliccato" },
  { value: "if_clicked", label: "Se ha cliccato" },
];

const MAX_STEPS = 5;

const emptyStep = (order: number): StepDraft => ({
  step_order: order,
  channel: "email",
  template_content: { subject: "", body: "" },
  delay_hours: order === 1 ? 0 : 72,
  condition: order === 1 ? "always" : "if_not_opened",
});

export const CampaignStepBuilder = ({
  campaignId,
  existingSteps,
  onStepsChange,
}: {
  campaignId?: number;
  existingSteps?: CampaignStep[];
  onStepsChange?: (steps: StepDraft[]) => void;
}) => {
  const [steps, setSteps] = useState<StepDraft[]>(() => {
    if (existingSteps && existingSteps.length > 0) {
      return existingSteps.map((s) => ({
        step_order: s.step_order,
        channel: s.channel,
        template_content: {
          subject: (s.template_content as Record<string, string>)?.subject ?? "",
          body: (s.template_content as Record<string, string>)?.body ?? "",
        },
        delay_hours: s.delay_hours,
        condition:
          typeof s.condition === "string"
            ? s.condition
            : (s.condition as Record<string, string>)?.type ?? "always",
      }));
    }
    return [emptyStep(1)];
  });

  const updateSteps = (newSteps: StepDraft[]) => {
    setSteps(newSteps);
    onStepsChange?.(newSteps);
  };

  const addStep = () => {
    if (steps.length >= MAX_STEPS) return;
    const newSteps = [...steps, emptyStep(steps.length + 1)];
    updateSteps(newSteps);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    const newSteps = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, step_order: i + 1 }));
    updateSteps(newSteps);
  };

  const updateStep = (index: number, field: string, value: unknown) => {
    const newSteps = [...steps];
    if (field === "subject" || field === "body") {
      newSteps[index] = {
        ...newSteps[index],
        template_content: {
          ...newSteps[index].template_content,
          [field]: value,
        },
      };
    } else {
      newSteps[index] = { ...newSteps[index], [field]: value };
    }
    updateSteps(newSteps);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Sequenza ({steps.length}/{MAX_STEPS} step)
        </h3>
        {steps.length < MAX_STEPS && (
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            <Plus className="h-3 w-3 mr-1" /> Aggiungi Step
          </Button>
        )}
      </div>

      {steps.map((step, index) => (
        <div key={index}>
          {index > 0 && (
            <div className="flex items-center justify-center py-1 text-muted-foreground">
              <ArrowDown className="h-4 w-4" />
              <span className="text-xs ml-1">
                dopo {step.delay_hours}h
              </span>
            </div>
          )}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-2 px-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Step {step.step_order}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {CHANNEL_OPTIONS.find((c) => c.value === step.channel)?.label ?? step.channel}
                </Badge>
              </div>
              {steps.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(index)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Canale</Label>
                  <Select
                    value={step.channel}
                    onValueChange={(v) => updateStep(index, "channel", v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNEL_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {index > 0 && (
                  <>
                    <div>
                      <Label className="text-xs">Ritardo (ore)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={step.delay_hours}
                        onChange={(e) =>
                          updateStep(index, "delay_hours", Number(e.target.value) || 0)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Condizione</Label>
                      <Select
                        value={step.condition}
                        onValueChange={(v) => updateStep(index, "condition", v)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
              {step.channel === "email" && (
                <div>
                  <Label className="text-xs">Oggetto</Label>
                  <Input
                    value={step.template_content.subject}
                    onChange={(e) => updateStep(index, "subject", e.target.value)}
                    placeholder="Oggetto email"
                    className="h-8 text-sm"
                  />
                </div>
              )}
              <div>
                <Label className="text-xs">Messaggio</Label>
                <Textarea
                  value={step.template_content.body}
                  onChange={(e) => updateStep(index, "body", e.target.value)}
                  placeholder="Corpo del messaggio. Usa {{first_name}}, {{last_name}} per personalizzare."
                  rows={3}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};

export const CampaignStepDisplay = ({ steps }: { steps: CampaignStep[] }) => {
  if (!steps || steps.length === 0) return null;

  const sorted = [...steps].sort((a, b) => a.step_order - b.step_order);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Sequenza ({sorted.length} step)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.map((step, i) => {
          const content = step.template_content as Record<string, string>;
          const condition =
            typeof step.condition === "string"
              ? step.condition
              : (step.condition as Record<string, string>)?.type ?? "always";

          return (
            <div key={String(step.id)}>
              {i > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground py-1 pl-4">
                  <ArrowDown className="h-3 w-3" />
                  {step.delay_hours}h &middot;{" "}
                  {CONDITION_OPTIONS.find((c) => c.value === condition)?.label ?? condition}
                </div>
              )}
              <div className="border rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    Step {step.step_order}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {step.channel}
                  </Badge>
                </div>
                {content?.subject && (
                  <p className="text-xs font-medium">{content.subject}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {content?.body}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
