import {
  TextInput,
  SelectInput,
  ReferenceInput,
  FileInput,
} from "@/components/admin";
import { required } from "ra-core";
import { ResourceFormShell } from "../layout/ResourceFormShell";

export const KnowledgeCreate = () => (
  <ResourceFormShell mode="create" redirect="list" maxWidth="lg" saveLabel="Upload Document">
    <div className="space-y-4 w-full">
      <TextInput source="title" validate={required()} helperText={false} />
      <ReferenceInput source="project_id" reference="projects">
        <SelectInput
          optionText="name"
          label="Project"
          validate={required()}
          helperText={false}
        />
      </ReferenceInput>
      <FileInput
        source="file"
        label="Document"
        accept=".pdf,.txt,.md,.docx"
      >
        <span />
      </FileInput>
    </div>
  </ResourceFormShell>
);
