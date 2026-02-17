import { primaryEmail, primaryPhone } from "./contactUtils.ts";

export function renderTemplate(
  template: string,
  contact: Record<string, any>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key === "first_name") return contact.first_name ?? "";
    if (key === "last_name") return contact.last_name ?? "";
    if (key === "email") return primaryEmail(contact) ?? "";
    if (key === "phone") return primaryPhone(contact) ?? "";
    return contact[key] ?? "";
  });
}
