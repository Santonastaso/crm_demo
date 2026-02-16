import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, createErrorResponse } from "../_shared/utils.ts";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    mimeType: string;
    body?: { data?: string; size?: number };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string; size?: number };
    }>;
  };
  internalDate: string;
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.access_token ?? null;
}

async function getValidToken(account: Record<string, any>): Promise<string> {
  const now = new Date();
  const expiry = account.token_expires_at ? new Date(account.token_expires_at) : new Date(0);

  if (now < expiry) {
    return account.access_token;
  }

  const newToken = await refreshAccessToken(account.refresh_token);
  if (!newToken) {
    throw new Error("Failed to refresh Gmail token");
  }

  await supabaseAdmin
    .from("email_accounts")
    .update({
      access_token: newToken,
      token_expires_at: new Date(Date.now() + 3500 * 1000).toISOString(),
    })
    .eq("id", account.id);

  return newToken;
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function extractEmail(headerValue: string): string {
  const match = headerValue.match(/<([^>]+)>/);
  return (match ? match[1] : headerValue).toLowerCase().trim();
}

function getBodyText(payload: GmailMessage["payload"]): string {
  if (payload.body?.data) {
    try {
      return atob(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    } catch {
      return "";
    }
  }

  if (payload.parts) {
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      try {
        return atob(textPart.body.data.replace(/-/g, "+").replace(/_/g, "/"));
      } catch {
        return "";
      }
    }
  }

  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return createErrorResponse(405, "Method Not Allowed");
  }

  const { sales_id } = await req.json();

  // Get all email accounts, or just one if sales_id provided
  let query = supabaseAdmin.from("email_accounts").select("*");
  if (sales_id) {
    query = query.eq("sales_id", sales_id);
  }

  const { data: accounts, error: accError } = await query;

  if (accError || !accounts?.length) {
    return createErrorResponse(404, "No email accounts found");
  }

  const results: Array<{ email: string; synced: number; errors: number }> = [];

  for (const account of accounts) {
    let synced = 0;
    let errors = 0;

    try {
      const token = await getValidToken(account);

      // Build query: fetch messages since last sync
      const lastSync = account.last_synced_at
        ? new Date(account.last_synced_at)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days

      const afterEpoch = Math.floor(lastSync.getTime() / 1000);
      const q = `after:${afterEpoch}`;

      const listUrl = `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(q)}&maxResults=50`;
      const listRes = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!listRes.ok) {
        console.error("Gmail list error:", await listRes.text());
        errors++;
        results.push({ email: account.email_address, synced, errors });
        continue;
      }

      const listData = await listRes.json();
      const messageRefs: Array<{ id: string }> = listData.messages ?? [];

      // Fetch each message details
      for (const ref of messageRefs) {
        try {
          // Check if already synced (dedup by external_id)
          const { data: existing } = await supabaseAdmin
            .from("communication_log")
            .select("id")
            .eq("external_id", ref.id)
            .limit(1);

          if (existing && existing.length > 0) continue;

          const msgRes = await fetch(
            `${GMAIL_API_BASE}/messages/${ref.id}?format=full`,
            { headers: { Authorization: `Bearer ${token}` } },
          );

          if (!msgRes.ok) {
            errors++;
            continue;
          }

          const msg: GmailMessage = await msgRes.json();
          const headers = msg.payload.headers;

          const from = extractEmail(getHeader(headers, "From"));
          const to = extractEmail(getHeader(headers, "To"));
          const subject = getHeader(headers, "Subject");
          const date = getHeader(headers, "Date");
          const snippet = msg.snippet ?? "";
          const bodyPreview = getBodyText(msg.payload).substring(0, 500) || snippet;

          // Determine direction
          const isOutbound = from.toLowerCase() === account.email_address.toLowerCase();
          const counterpartyEmail = isOutbound ? to : from;
          const direction = isOutbound ? "outbound" : "inbound";

          // Match counterparty email to a contact
          // We search contacts.email_jsonb which is an array of { email, type }
          const { data: contacts } = await supabaseAdmin
            .from("contacts")
            .select("id, email_jsonb")
            .limit(500);

          let contactId: number | null = null;
          if (contacts) {
            for (const c of contacts) {
              const emails: Array<{ email: string }> = c.email_jsonb ?? [];
              if (emails.some((e) => e.email?.toLowerCase() === counterpartyEmail)) {
                contactId = c.id;
                break;
              }
            }
          }

          // Insert into communication_log
          const timestamp = date
            ? new Date(date).toISOString()
            : new Date(parseInt(msg.internalDate, 10)).toISOString();

          await supabaseAdmin.from("communication_log").insert({
            contact_id: contactId,
            channel: "email",
            direction,
            subject,
            content_summary: bodyPreview,
            external_id: ref.id,
            metadata: {
              gmail_thread_id: msg.threadId,
              from,
              to,
            },
            created_at: timestamp,
          });

          synced++;
        } catch (msgErr) {
          console.error(`Error processing message ${ref.id}:`, msgErr);
          errors++;
        }
      }

      // Update last_synced_at
      await supabaseAdmin
        .from("email_accounts")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", account.id);
    } catch (err) {
      console.error(`Sync error for ${account.email_address}:`, err);
      errors++;
    }

    results.push({ email: account.email_address, synced, errors });
  }

  return new Response(
    JSON.stringify({ results }),
    { headers: { "Content-Type": "application/json", ...corsHeaders } },
  );
});
