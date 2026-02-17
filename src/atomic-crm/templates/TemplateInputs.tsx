import {
  TextInput,
  SelectInput,
  ReferenceInput,
} from "@/components/admin";
import { required } from "ra-core";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useInvokeFunction } from "../hooks/useInvokeFunction";

const CHANNEL_CHOICES = [
  { id: "email", name: "Email" },
  { id: "whatsapp", name: "WhatsApp" },
  { id: "sms", name: "SMS" },
];

const GenerateWithAI = () => {
  const form = useFormContext();
  const { invoke, loading } = useInvokeFunction();

  const handleGenerate = async () => {
    const channel = form.getValues("channel") || "email";
    const projectId = form.getValues("project_id");

    const result = await invoke(
      "generate-campaign-content",
      {
        channel,
        project_id: projectId || undefined,
        language: "Italian",
      },
      {
        successMessage: "Contenuto generato",
        errorMessage: "Generazione fallita",
      },
    );

    if (result?.body) {
      form.setValue("body", result.body, { shouldDirty: true });
    }
    if (result?.subject && channel === "email") {
      form.setValue("subject", result.subject, { shouldDirty: true });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      Genera con AI
    </Button>
  );
};

export const TemplateInputs = () => (
  <div className="space-y-4 w-full">
    <TextInput source="name" validate={required()} helperText={false} />
    <SelectInput
      source="channel"
      choices={CHANNEL_CHOICES}
      defaultValue="email"
      validate={required()}
      helperText={false}
    />
    <ReferenceInput source="project_id" reference="projects">
      <SelectInput optionText="name" label="Project" helperText={false} />
    </ReferenceInput>
    <TextInput source="subject" helperText="For email templates only" />
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">Body</span>
      <GenerateWithAI />
    </div>
    <TextInput
      source="body"
      multiline
      rows={8}
      validate={required()}
      helperText="Use {{variable_name}} for dynamic content"
    />
  </div>
);
