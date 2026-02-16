import { EditBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { FormToolbar } from "../layout/FormToolbar";
import { TemplateInputs } from "./TemplateInputs";

export const TemplateEdit = () => (
  <EditBase redirect="list">
    <div className="mt-2 max-w-lg mx-auto">
      <Form>
        <Card>
          <CardContent>
            <TemplateInputs />
            <FormToolbar />
          </CardContent>
        </Card>
      </Form>
    </div>
  </EditBase>
);
