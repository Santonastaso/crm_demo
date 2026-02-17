import { supabaseAdmin } from "./supabaseAdmin.ts";
import { CONTACT_QUERY_LIMIT } from "./constants.ts";

export function primaryEmail(
  contact: { email_jsonb?: Array<{ email: string }> | null },
): string | null {
  return (contact.email_jsonb ?? [])[0]?.email ?? null;
}

export function primaryPhone(
  contact: { phone_jsonb?: Array<{ number: string }> | null },
): string | null {
  return (contact.phone_jsonb ?? [])[0]?.number ?? null;
}

export async function getContactById(id: number) {
  const { data } = await supabaseAdmin
    .from("contacts")
    .select("id, first_name, last_name, email_jsonb, phone_jsonb")
    .eq("id", id)
    .single();
  return data;
}

export function contactFullName(
  contact: { first_name?: string | null; last_name?: string | null },
  fallback = "Prospect",
): string {
  return `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || fallback;
}

export async function findContactByPhone(phone: string): Promise<number | null> {
  const normalized = phone.replace(/\s+/g, "");
  const { data: contacts } = await supabaseAdmin
    .from("contacts")
    .select("id, phone_jsonb")
    .limit(CONTACT_QUERY_LIMIT);

  if (!contacts) return null;

  for (const c of contacts) {
    const phones: Array<{ number?: string }> = c.phone_jsonb ?? [];
    for (const p of phones) {
      const pNorm = (p.number ?? "").replace(/\s+/g, "");
      if (pNorm === normalized || pNorm === normalized.replace(/^\+/, "")) {
        return c.id;
      }
    }
  }
  return null;
}

export async function findOrCreateContactByPhone(
  phone: string,
  displayName = "Unknown User",
  source = "whatsapp",
): Promise<number | null> {
  const existing = await findContactByPhone(phone);
  if (existing) return existing;

  const nameParts = displayName.split(" ");
  const { data: newContact } = await supabaseAdmin
    .from("contacts")
    .insert({
      first_name: nameParts[0] ?? "Unknown",
      last_name: nameParts.slice(1).join(" ") || "",
      phone_jsonb: [{ number: phone, type: "Work" }],
      email_jsonb: [],
      status: "cold",
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      has_newsletter: false,
      tags: [],
      source,
    })
    .select("id")
    .single();

  return newContact?.id ?? null;
}

export async function findContactByEmail(email: string): Promise<number | null> {
  const target = email.toLowerCase();
  const { data: contacts } = await supabaseAdmin
    .from("contacts")
    .select("id, email_jsonb")
    .limit(CONTACT_QUERY_LIMIT);

  if (!contacts) return null;

  for (const c of contacts) {
    const emails: Array<{ email: string }> = c.email_jsonb ?? [];
    if (emails.some((e) => e.email?.toLowerCase() === target)) {
      return c.id;
    }
  }
  return null;
}
