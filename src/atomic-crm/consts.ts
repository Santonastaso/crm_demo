import type { Sale } from "./types/core";

export const COMPANY_CREATED = "company.created" as const;
export const CONTACT_CREATED = "contact.created" as const;
export const CONTACT_NOTE_CREATED = "contactNote.created" as const;
export const DEAL_CREATED = "deal.created" as const;
export const DEAL_NOTE_CREATED = "dealNote.created" as const;

export const LEAD_TYPES = [
  { id: "investitore", name: "Investitore", label: "Investitore" },
  { id: "prima_casa", name: "Prima Casa", label: "Prima Casa" },
  { id: "upgrade", name: "Upgrade", label: "Upgrade" },
  { id: "secondo_immobile", name: "Secondo Immobile", label: "Secondo Immobile" },
] as const;

export const saleOptionRenderer = (choice: Sale) =>
  `${choice.first_name} ${choice.last_name}`;

export const formatSlotTime = (time: string): string =>
  time.includes("T")
    ? new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : time;

export const DEFAULT_FALLBACK_EMAIL = "noreply@crm.local";
export const TIMELINE_PAGE_SIZE = 100;
