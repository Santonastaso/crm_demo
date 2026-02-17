type CanAccessParams<
  RecordType extends Record<string, any> = Record<string, any>,
> = {
  action: string;
  resource: string;
  record?: RecordType;
};

import type { UserRole } from "@/atomic-crm/types";
export type { UserRole };

const ADMIN_ONLY_RESOURCES = ["sales"];
const MANAGER_PLUS_RESOURCES = ["segments", "campaigns", "campaign_steps", "discovery_scans", "templates", "projects"];
const WRITE_ACTIONS = ["create", "edit", "delete", "export"];

export const canAccess = <
  RecordType extends Record<string, any> = Record<string, any>,
>(
  role: UserRole | string,
  params: CanAccessParams<RecordType>,
) => {
  if (role === "admin") {
    return true;
  }

  if (role === "manager") {
    if (ADMIN_ONLY_RESOURCES.includes(params.resource)) {
      return false;
    }
    return true;
  }

  if (role === "agent") {
    if (ADMIN_ONLY_RESOURCES.includes(params.resource)) {
      return false;
    }
    if (MANAGER_PLUS_RESOURCES.includes(params.resource) && WRITE_ACTIONS.includes(params.action)) {
      return false;
    }
    return true;
  }

  if (role === "read_only") {
    if (params.action === "list" || params.action === "show") {
      return true;
    }
    return false;
  }

  return false;
};
