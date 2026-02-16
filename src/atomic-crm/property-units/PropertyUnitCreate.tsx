import { CreateBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton, SaveButton, FormToolbar } from "@/components/admin";
import { PropertyUnitInputs } from "./PropertyUnitInputs";

export const PropertyUnitCreate = () => (
  <CreateBase redirect="list">
    <div className="mt-2 max-w-2xl mx-auto">
      <Form>
        <Card>
          <CardContent>
            <PropertyUnitInputs />
            <FormToolbar>
              <div className="flex flex-row gap-2 justify-end">
                <CancelButton />
                <SaveButton label="Create Unit" />
              </div>
            </FormToolbar>
          </CardContent>
        </Card>
      </Form>
    </div>
  </CreateBase>
);
