import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createErrorResponse, createJsonResponse } from "../_shared/utils.ts";
import { getValidGmailToken } from "../_shared/gmailToken.ts";
import { logCommunication } from "../_shared/communicationLog.ts";
import { requirePost } from "../_shared/requestHandler.ts";
import { findContactByEmail } from "../_shared/contactUtils.ts";

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
  const earlyResponse = requirePost(req);
  if (earlyResponse) return earlyResponse;

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
      const token = await getValidGmailToken(
        account.id,
        account.access_token,
        account.refresh_token,
        account.token_expires_at,
      );

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
          const contactId = await findContactByEmail(counterpartyEmail);

          // Insert into communication_log
          const timestamp = date
            ? new Date(date).toISOString()
            : new Date(parseInt(msg.internalDate, 10)).toISOString();

          await logCommunication({
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

  return createJsonResponse({ results });
});
