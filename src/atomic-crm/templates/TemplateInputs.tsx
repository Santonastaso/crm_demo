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
];

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
    <TextInput
      source="body"
      multiline
      rows={8}
      validate={required()}
      helperText="Use {{variable_name}} for dynamic content"
    />
  </div>
);
