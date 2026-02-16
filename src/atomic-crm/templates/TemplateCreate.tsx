import { CreateBase, Form, useGetIdentity } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton, SaveButton, FormToolbar } from "@/components/admin";
import { TemplateInputs } from "./TemplateInputs";

export const TemplateCreate = () => {
  const { identity } = useGetIdentity();
  return (
    <CreateBase redirect="list">
      <div className="mt-2 max-w-lg mx-auto">
        <Form defaultValues={{ sales_id: identity?.id, variables: [] }}>
          <Card>
            <CardContent>
              <TemplateInputs />
              <FormToolbar>
                <div className="flex flex-row gap-2 justify-end">
                  <CancelButton />
                  <SaveButton label="Create Template" />
                </div>
              </FormToolbar>
            </CardContent>
          </Card>
        </Form>
      </div>
    </CreateBase>
  );
};
