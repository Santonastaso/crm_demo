import type { ReactNode } from "react";
import type { MutationMode } from "ra-core";
import { CreateBase, EditBase, Form } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";
import { CancelButton, SaveButton, FormToolbar } from "@/components/admin";

interface ResourceFormShellProps {
  mode: "create" | "edit";
  children: ReactNode;
  aside?: ReactNode;
  redirect?: string | false;
  maxWidth?: string;
  saveLabel?: string;
  defaultValues?: Record<string, unknown>;
  mutationOptions?: Record<string, unknown>;
  mutationMode?: MutationMode;
  transform?: (data: Record<string, unknown>) => Record<string, unknown>;
  formClassName?: string;
}

export const ResourceFormShell = ({
  mode,
  children,
  aside,
  redirect = mode === "create" ? "list" : "show",
  maxWidth = "2xl",
  saveLabel,
  defaultValues,
  mutationOptions,
  mutationMode,
  transform,
  formClassName,
}: ResourceFormShellProps) => {
  const Base = mode === "create" ? CreateBase : EditBase;
  const wrapperClass = aside
    ? "mt-2 flex gap-8"
    : `mt-2 max-w-${maxWidth} mx-auto`;

  return (
    <Base redirect={redirect} mutationMode={mutationMode} mutationOptions={mutationOptions} transform={transform}>
      <div className={wrapperClass}>
        <Form defaultValues={defaultValues} className={formClassName}>
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
        {aside}
      </div>
    </Base>
  );
};
