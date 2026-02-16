import { CreateBase, Form, useGetIdentity } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import {
  CancelButton,
  SaveButton,
  FormToolbar,
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

export const CampaignCreate = () => {
  const { identity } = useGetIdentity();
  return (
    <CreateBase redirect="show">
      <div className="mt-2 max-w-lg mx-auto">
        <Form defaultValues={{ sales_id: identity?.id, status: "draft", channel: "email" }}>
          <Card>
            <CardContent>
              <div className="space-y-4 w-full">
                <TextInput source="name" validate={required()} helperText={false} />
                <ReferenceInput source="project_id" reference="projects">
                  <SelectInput
                    optionText="name"
                    label="Project"
                    helperText={false}
                  />
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
                    label="Message Template"
                    validate={required()}
                    helperText={false}
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
              <FormToolbar>
                <div className="flex flex-row gap-2 justify-end">
                  <CancelButton />
                  <SaveButton label="Create Campaign" />
                </div>
              </FormToolbar>
            </CardContent>
          </Card>
        </Form>
      </div>
    </CreateBase>
  );
};
