import type { Identifier, RaRecord } from "ra-core";
import {
  CreateBase,
  Form,
  useGetIdentity,
  useListContext,
  useNotify,
  useRecordContext,
  useResourceContext,
} from "ra-core";
import { useFormContext } from "react-hook-form";
import { SaveButton, ReferenceArrayInput, AutocompleteArrayInput } from "@/components/admin";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileInput } from "@/components/admin/file-input";
import type { Deal } from "../../types";

const interactionTypes = [
  "Email",
  "Chiamata",
  "Meeting",
  "Demo",
  "Proposta",
  "Negoziazione",
  "Follow-up",
  "Altro",
];

const sentiments = ["Positivo", "Neutro", "Negativo", "Critico"];

export const InteractionCreate = ({ className }: { className?: string }) => {
  const resource = useResourceContext();
  const record = useRecordContext<Deal>();
  const { identity } = useGetIdentity();

  if (!record || !identity) return null;

  return (
    <CreateBase resource={resource} redirect={false}>
      <Form>
        <div className={cn("space-y-4", className)}>
          <InteractionInputs dealRecord={record} />
          <InteractionCreateButton record={record} />
        </div>
      </Form>
    </CreateBase>
  );
};

const InteractionInputs = ({ dealRecord }: { dealRecord: Deal }) => {
  const { setValue, watch } = useFormContext();
  const currentType = watch("type");
  const currentSentiment = watch("sentiment");

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select
            value={currentType || ""}
            onValueChange={(value) => setValue("type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {interactionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date & Time *</Label>
          <Input
            type="datetime-local"
            id="date"
            {...{ defaultValue: new Date().toISOString().slice(0, 16) }}
            onChange={(e) => setValue("date", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            type="number"
            id="duration"
            placeholder="30"
            min="0"
            onChange={(e) =>
              setValue("duration", e.target.value ? parseInt(e.target.value) : null)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sentiment">Sentiment</Label>
          <Select
            value={currentSentiment || ""}
            onValueChange={(value) => setValue("sentiment", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sentiment" />
            </SelectTrigger>
            <SelectContent>
              {sentiments.map((sentiment) => (
                <SelectItem key={sentiment} value={sentiment}>
                  {sentiment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {dealRecord.contact_ids && dealRecord.contact_ids.length > 0 && (
        <div className="space-y-2">
          <ReferenceArrayInput
            source="participant_ids"
            reference="contacts_summary"
            filter={{ "id@in": `(${dealRecord.contact_ids.join(",")})` }}
          >
            <AutocompleteArrayInput
              label="Participants"
              helperText={false}
              optionText={(choice: any) =>
                choice ? `${choice.first_name} ${choice.last_name}` : ""
              }
            />
          </ReferenceArrayInput>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={4}
          placeholder="Add details about this interaction..."
          onChange={(e) => setValue("notes", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Attachments</Label>
        <FileInput source="attachments" multiple accept="*" />
      </div>
    </>
  );
};

const InteractionCreateButton = ({ record }: { record: RaRecord<Identifier> }) => {
  const notify = useNotify();
  const { identity } = useGetIdentity();
  const { reset } = useFormContext();
  const { refetch } = useListContext();

  if (!record || !identity) return null;

  const handleSuccess = () => {
    reset(
      {
        type: null,
        date: new Date().toISOString().slice(0, 16),
        duration: null,
        participant_ids: [],
        notes: null,
        attachments: null,
        sentiment: null,
      },
      { keepValues: false }
    );
    refetch();
    notify("Interaction added");
  };

  return (
    <div className="flex justify-end">
      <SaveButton
        type="button"
        label="Add Interaction"
        transform={(data) => ({
          ...data,
          deal_id: record.id,
          sales_id: identity.id,
          date: data.date
            ? new Date(data.date).toISOString()
            : new Date().toISOString(),
        })}
        mutationOptions={{
          onSuccess: handleSuccess,
        }}
      />
    </div>
  );
};

