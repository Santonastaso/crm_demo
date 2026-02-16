import { CreateBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton, SaveButton, FormToolbar } from "@/components/admin";
import { ProjectInputs } from "./ProjectInputs";

export const ProjectCreate = () => (
  <CreateBase redirect="list">
    <div className="mt-2 max-w-lg mx-auto">
      <Form>
        <Card>
          <CardContent>
            <ProjectInputs />
            <FormToolbar>
              <div className="flex flex-row gap-2 justify-end">
                <CancelButton />
                <SaveButton label="Create Project" />
              </div>
            </FormToolbar>
          </CardContent>
        </Card>
      </Form>
    </div>
  </CreateBase>
);
