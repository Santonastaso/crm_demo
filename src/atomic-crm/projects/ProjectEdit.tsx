import { EditBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { FormToolbar } from "../layout/FormToolbar";
import { ProjectInputs } from "./ProjectInputs";

export const ProjectEdit = () => (
  <EditBase redirect="list">
    <div className="mt-2 max-w-lg mx-auto">
      <Form>
        <Card>
          <CardContent>
            <ProjectInputs />
            <FormToolbar />
          </CardContent>
        </Card>
      </Form>
    </div>
  </EditBase>
);
