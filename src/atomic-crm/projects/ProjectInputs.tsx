import { TextInput, SelectInput } from "@/components/admin";
import { required } from "ra-core";

const STATUS_CHOICES = [
  { id: "active", name: "Active" },
  { id: "archived", name: "Archived" },
];

export const ProjectInputs = () => (
  <div className="space-y-4 w-full">
    <TextInput source="name" validate={required()} helperText={false} />
    <TextInput source="slug" validate={required()} helperText={false} />
    <TextInput source="description" multiline helperText={false} />
    <TextInput source="location" helperText={false} />
    <div className="grid grid-cols-2 gap-4">
      <TextInput source="location_lat" label="Latitude" helperText={false} />
      <TextInput source="location_lng" label="Longitude" helperText={false} />
    </div>
    <SelectInput
      source="status"
      choices={STATUS_CHOICES}
      defaultValue="active"
      validate={required()}
      helperText={false}
    />
  </div>
);
