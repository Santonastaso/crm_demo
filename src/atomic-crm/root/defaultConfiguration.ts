import { Mars, NonBinary, Venus } from "lucide-react";

export const defaultDarkModeLogo = "";
export const defaultLightModeLogo = "";

export const defaultTitle = "Arte di Abitare CRM";

export const defaultCompanySectors = [
  "Costruzioni",
  "Immobiliare",
  "Finanziario",
  "Legale",
  "Architettura",
  "Interior Design",
  "Consulenza",
  "Altro",
];

export const defaultDealStages = [
  { value: "qualifica", label: "Qualifica" },
  { value: "visita", label: "Visita" },
  { value: "proposta", label: "Proposta" },
  { value: "trattativa", label: "Trattativa" },
  { value: "compromesso", label: "Compromesso" },
  { value: "rogito", label: "Rogito" },
  { value: "perso", label: "Perso" },
];

export const defaultDealPipelineStatuses = ["rogito"];

export const defaultDealCategories = [
  "Prima Casa",
  "Investimento",
  "Upgrade",
  "Secondo Immobile",
  "Commerciale",
];

export const defaultNoteStatuses = [
  { value: "cold", label: "Cold", color: "#7dbde8" },
  { value: "warm", label: "Warm", color: "#e8cb7d" },
  { value: "hot", label: "Hot", color: "#e88b7d" },
  { value: "in-contract", label: "In Contract", color: "#a4e87d" },
];

export const defaultTaskTypes = [
  "None",
  "Email",
  "Demo",
  "Lunch",
  "Meeting",
  "Follow-up",
  "Thank you",
  "Ship",
  "Call",
];

export const defaultContactGender = [
  { value: "male", label: "He/Him", icon: Mars },
  { value: "female", label: "She/Her", icon: Venus },
  { value: "nonbinary", label: "They/Them", icon: NonBinary },
];
