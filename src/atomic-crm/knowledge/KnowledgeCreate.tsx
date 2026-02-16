import { CreateBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import {
  CancelButton,
  SaveButton,
  FormToolbar,
  TextInput,
  SelectInput,
  ReferenceInput,
  FileInput,
} from "@/components/admin";
import { required } from "ra-core";

export const KnowledgeCreate = () => (
  <CreateBase redirect="list">
    <div className="mt-2 max-w-lg mx-auto">
      <Form>
        <Card>
          <CardContent>
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
            <FormToolbar>
              <div className="flex flex-row gap-2 justify-end">
                <CancelButton />
                <SaveButton label="Upload Document" />
              </div>
            </FormToolbar>
          </CardContent>
        </Card>
      </Form>
    </div>
  </CreateBase>
);
