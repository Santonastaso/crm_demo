import type { ReactNode } from "react";
import { CreateBase, EditBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton, SaveButton, FormToolbar } from "@/components/admin";

interface ResourceFormShellProps {
  mode: "create" | "edit";
  children: ReactNode;
  redirect?: string | false;
  maxWidth?: string;
  saveLabel?: string;
  defaultValues?: Record<string, unknown>;
  mutationOptions?: Record<string, unknown>;
  transform?: (data: Record<string, unknown>) => Record<string, unknown>;
}

export const ResourceFormShell = ({
  mode,
  children,
  redirect = mode === "create" ? "list" : "show",
  maxWidth = "2xl",
  saveLabel,
  defaultValues,
  mutationOptions,
  transform,
}: ResourceFormShellProps) => {
  const Base = mode === "create" ? CreateBase : EditBase;
  return (
    <Base redirect={redirect} mutationOptions={mutationOptions} transform={transform}>
      <div className={`mt-2 max-w-${maxWidth} mx-auto`}>
        <Form defaultValues={defaultValues}>
          <Card>
            <CardContent>
              {children}
              {mode === "create" ? (
                <FormToolbar>
                  <div className="flex flex-row gap-2 justify-end">
                    <CancelButton />
                    <SaveButton label={saveLabel} />
                  </div>
                </FormToolbar>
              ) : (
                <FormToolbar />
              )}
            </CardContent>
          </Card>
        </Form>
      </div>
    </Base>
  );
};
