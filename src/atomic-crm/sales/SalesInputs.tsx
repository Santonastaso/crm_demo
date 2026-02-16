import { BooleanInput, SelectInput, TextInput } from "@/components/admin";
import { email, required, useGetIdentity, useRecordContext } from "ra-core";
import type { Sale } from "../types";

const ROLE_CHOICES = [
  { id: "admin", name: "Admin" },
  { id: "manager", name: "Manager" },
  { id: "agent", name: "Agent" },
  { id: "read_only", name: "Read-Only" },
];

export function SalesInputs() {
  const { identity } = useGetIdentity();
  const record = useRecordContext<Sale>();
  return (
    <div className="space-y-4 w-full">
      <TextInput source="first_name" validate={required()} helperText={false} />
      <TextInput source="last_name" validate={required()} helperText={false} />
      <TextInput
        source="email"
        validate={[required(), email()]}
        helperText={false}
      />
      <SelectInput
        source="role"
        choices={ROLE_CHOICES}
        defaultValue="agent"
        validate={required()}
        readOnly={record?.id === identity?.id}
        helperText={false}
      />
      <BooleanInput
        source="disabled"
        readOnly={record?.id === identity?.id}
        helperText={false}
      />
    </div>
  );
}
