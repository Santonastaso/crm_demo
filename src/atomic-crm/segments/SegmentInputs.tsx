import {
  TextInput,
  BooleanInput,
  ReferenceInput,
  SelectInput,
} from "@/components/admin";
import { required, useGetList } from "ra-core";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FIELD_CHOICES = [
  { id: "status", name: "Status" },
  { id: "tags", name: "Tags" },
  { id: "company_id", name: "Company" },
  { id: "sales_id", name: "Assigned Agent" },
  { id: "has_newsletter", name: "Has Newsletter" },
  { id: "gender", name: "Gender" },
  { id: "first_seen", name: "First Seen" },
  { id: "last_seen", name: "Last Seen" },
];

const OPERATOR_CHOICES = [
  { id: "eq", name: "equals" },
  { id: "neq", name: "not equals" },
  { id: "contains", name: "contains" },
  { id: "gt", name: "greater than" },
  { id: "lt", name: "less than" },
  { id: "in", name: "in" },
  { id: "not_in", name: "not in" },
];

const TAG_OPERATOR_CHOICES = [
  { id: "contains", name: "has all of" },
  { id: "in", name: "has any of" },
  { id: "not_in", name: "has none of" },
];

const TagValueInput = ({ index }: { index: number }) => {
  const { setValue } = useFormContext();
  const currentValue = useWatch({ name: `criteria.${index}.value` });
  const { data: tags = [] } = useGetList("tags", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
  });

  const selectedIds: number[] = (() => {
    if (Array.isArray(currentValue)) return currentValue.map(Number);
    if (typeof currentValue === "string" && currentValue) {
      return currentValue
        .split(",")
        .map((s: string) => Number(s.trim()))
        .filter((n: number) => !isNaN(n) && n > 0);
    }
    return [];
  })();

  const toggleTag = (tagId: number) => {
    const next = selectedIds.includes(tagId)
      ? selectedIds.filter((id) => id !== tagId)
      : [...selectedIds, tagId];
    setValue(`criteria.${index}.value`, next.join(","));
  };

  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
      <div className="flex flex-wrap gap-1 min-h-[36px] rounded-md border border-input bg-background px-2 py-1.5">
        {tags.length === 0 && (
          <span className="text-xs text-muted-foreground">Loading...</span>
        )}
        {tags.map((tag: { id: number; name: string; color?: string }) => {
          const selected = selectedIds.includes(tag.id);
          return (
            <Badge
              key={tag.id}
              variant={selected ? "default" : "outline"}
              className="cursor-pointer text-xs"
              style={
                selected && tag.color
                  ? { backgroundColor: tag.color, borderColor: tag.color }
                  : undefined
              }
              onClick={() => toggleTag(tag.id)}
            >
              {tag.name}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

const CriteriaRule = ({
  index,
  onRemove,
}: {
  index: number;
  onRemove: () => void;
}) => {
  const fieldValue = useWatch({ name: `criteria.${index}.field` });
  const isTagField = fieldValue === "tags";

  return (
    <Card>
      <CardContent className="flex flex-row items-end gap-2 py-2 px-3">
        <div className="flex-1">
          <SelectInput
            source={`criteria.${index}.field`}
            choices={FIELD_CHOICES}
            label="Field"
            helperText={false}
          />
        </div>
        <div className="flex-1">
          <SelectInput
            source={`criteria.${index}.operator`}
            choices={isTagField ? TAG_OPERATOR_CHOICES : OPERATOR_CHOICES}
            label="Operator"
            helperText={false}
          />
        </div>
        <div className="flex-1">
          {isTagField ? (
            <TagValueInput index={index} />
          ) : (
            <TextInput
              source={`criteria.${index}.value`}
              label="Value"
              helperText={false}
            />
          )}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

const CriteriaBuilder = () => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "criteria",
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filter Rules</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({ field: "status", operator: "eq", value: "" })
          }
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Rule
        </Button>
      </div>
      {fields.map((field, index) => (
        <CriteriaRule
          key={field.id}
          index={index}
          onRemove={() => remove(index)}
        />
      ))}
      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No rules defined. All contacts will match this segment.
        </p>
      )}
    </div>
  );
};

export const SegmentInputs = () => (
  <div className="space-y-4 w-full">
    <TextInput source="name" validate={required()} helperText={false} />
    <ReferenceInput source="project_id" reference="projects">
      <SelectInput optionText="name" label="Project" helperText={false} />
    </ReferenceInput>
    <BooleanInput
      source="auto_refresh"
      label="Auto-refresh membership"
      helperText={false}
    />
    <CriteriaBuilder />
  </div>
);
