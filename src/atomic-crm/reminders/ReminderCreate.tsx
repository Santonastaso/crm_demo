import { useState } from "react";
import {
  CreateBase,
  Form,
  useGetIdentity,
  useNotify,
  useRefresh,
} from "ra-core";
import { useFormContext } from "react-hook-form";
import { SaveButton, ReferenceInput, SelectInput } from "@/components/admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addDays, addWeeks } from "date-fns";

const priorities = [
  { value: "low", label: "Low", color: "bg-blue-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-500" },
];

interface ReminderCreateProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string | number;
}

export const ReminderCreate = ({
  open,
  onClose,
  entityType,
  entityId,
}: ReminderCreateProps) => {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Set Reminder</DialogTitle>
          {/* Provide description for accessibility to satisfy aria-describedby */}
          <DialogDescription>
            Choose when to be notified and what action to take.
          </DialogDescription>
        </DialogHeader>
        <CreateBase resource="reminders" redirect={false}>
          <Form>
            <ReminderForm
              onClose={onClose}
              entityType={entityType}
              entityId={entityId}
            />
          </Form>
        </CreateBase>
      </DialogContent>
    </Dialog>
  );
};

const ReminderForm = ({
  onClose,
  entityType,
  entityId,
}: {
  onClose: () => void;
  entityType: string;
  entityId: string | number;
}) => {
  const { setValue, watch } = useFormContext();
  const { identity } = useGetIdentity();
  const notify = useNotify();
  const refresh = useRefresh();

  const [triggerType, setTriggerType] = useState<"absolute" | "relative">(
    "absolute"
  );
  const [relativeValue, setRelativeValue] = useState(7);
  const [relativeUnit, setRelativeUnit] = useState<"days" | "weeks">("days");

  const currentPriority = watch("priority") || "medium";

  const calculateTriggerDate = () => {
    if (triggerType === "absolute") {
      const dateValue = watch("trigger_date_input");
      return dateValue ? new Date(dateValue).toISOString() : new Date().toISOString();
    } else {
      const now = new Date();
      const futureDate =
        relativeUnit === "days"
          ? addDays(now, relativeValue)
          : addWeeks(now, relativeValue);
      return futureDate.toISOString();
    }
  };

  if (!identity) return null;

  return (
    <div className="space-y-6">
      {/* When to trigger */}
      <div className="space-y-3">
        <Label>When to notify</Label>
        <RadioGroup
          value={triggerType}
          onValueChange={(value) => setTriggerType(value as "absolute" | "relative")}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="absolute" id="absolute" />
            <Label htmlFor="absolute" className="font-normal">
              Specific date and time
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="relative" id="relative" />
            <Label htmlFor="relative" className="font-normal">
              Relative (from now)
            </Label>
          </div>
        </RadioGroup>

        {triggerType === "absolute" ? (
          <Input
            type="datetime-local"
            defaultValue={new Date().toISOString().slice(0, 16)}
            onChange={(e) => setValue("trigger_date_input", e.target.value)}
          />
        ) : (
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={relativeValue}
              onChange={(e) => setRelativeValue(parseInt(e.target.value) || 1)}
              className="w-24"
            />
            <Select value={relativeUnit} onValueChange={(v) => setRelativeUnit(v as any)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Weeks</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground self-center">from now</span>
          </div>
        )}
      </div>

      {/* Action text */}
      <div className="space-y-2">
        <Label htmlFor="action_text">What needs to be done? *</Label>
        <Input
          id="action_text"
          placeholder="e.g., Follow up with client about proposal"
          onChange={(e) => setValue("action_text", e.target.value)}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Additional notes (optional)</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="Add any additional context or details..."
          onChange={(e) => setValue("description", e.target.value)}
        />
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label>Priority</Label>
        <Select
          value={currentPriority}
          onValueChange={(value) => setValue("priority", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorities.map((priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${priority.color}`} />
                  {priority.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assigned to */}
      <div className="space-y-2">
        <ReferenceInput 
          source="sales_id" 
          reference="sales"
          filter={{ "disabled@neq": true }}
        >
          <SelectInput
            label="Assigned to"
            helperText={false}
            defaultValue={identity.id}
            optionText={(choice: any) =>
              choice ? `${choice.first_name} ${choice.last_name}` : ""
            }
          />
        </ReferenceInput>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <SaveButton
          type="button"
          label="Create Reminder"
          transform={(data) => {
            const { trigger_date_input: _trigger_date_input, ...allowedData } = data as any;
            return {
              ...allowedData,
              entity_type: entityType,
              entity_id: entityId,
              sales_id: identity.id,
              trigger_type: triggerType,
              trigger_date: calculateTriggerDate(),
              status: "pending",
              priority: allowedData.priority || "medium",
            };
          }}
          mutationOptions={{
            onSuccess: () => {
              notify("Reminder created");
              refresh();
              onClose();
            },
          }}
        />
      </div>
    </div>
  );
};

