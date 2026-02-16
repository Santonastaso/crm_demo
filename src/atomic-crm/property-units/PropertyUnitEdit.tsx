import { EditBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { FormToolbar } from "../layout/FormToolbar";
import { PropertyUnitInputs } from "./PropertyUnitInputs";

export const PropertyUnitEdit = () => (
  <EditBase redirect="show">
    <div className="mt-2 max-w-2xl mx-auto">
      <Form>
        <Card>
          <CardContent>
            <PropertyUnitInputs />
            <FormToolbar />
          </CardContent>
        </Card>
      </Form>
    </div>
  </EditBase>
);
