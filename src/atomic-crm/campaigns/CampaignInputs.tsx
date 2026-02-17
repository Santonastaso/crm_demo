import {
  TextInput,
  SelectInput,
  ReferenceInput,
} from "@/components/admin";
import { required } from "ra-core";

const CHANNEL_CHOICES = [
  { id: "email", name: "Email" },
  { id: "whatsapp", name: "WhatsApp" },
  { id: "sms", name: "SMS" },
  { id: "multi", name: "Multi-channel" },
];

const STATUS_CHOICES = [
  { id: "draft", name: "Draft" },
  { id: "scheduled", name: "Scheduled" },
];

export const CampaignInputs = () => (
  <div className="space-y-4 w-full">
    <TextInput source="name" validate={required()} helperText={false} />
    <ReferenceInput source="project_id" reference="projects">
      <SelectInput optionText="name" label="Project" helperText={false} />
    </ReferenceInput>
    <ReferenceInput source="segment_id" reference="segments">
      <SelectInput
        optionText="name"
        label="Target Segment"
        validate={required()}
        helperText={false}
      />
    </ReferenceInput>
    <ReferenceInput source="template_id" reference="templates">
      <SelectInput
        optionText="name"
        label="Message Template (Step 1)"
        validate={required()}
        helperText="Used for the first step. Add more steps after creation."
      />
    </ReferenceInput>
    <SelectInput
      source="channel"
      choices={CHANNEL_CHOICES}
      validate={required()}
      helperText={false}
    />
    <SelectInput
      source="status"
      choices={STATUS_CHOICES}
      validate={required()}
      helperText={false}
    />
    <TextInput
      source="scheduled_at"
      type="datetime-local"
      label="Schedule At"
      helperText="Leave empty for draft"
    />
  </div>
);
