import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createErrorResponse, createJsonResponse } from "../_shared/utils.ts";
import { fetchJson } from "../_shared/fetchJson.ts";
import { getValidGmailToken } from "../_shared/gmailToken.ts";
import { logCommunication } from "../_shared/communicationLog.ts";
import { requirePost } from "../_shared/requestHandler.ts";
import { parseJsonBody } from "../_shared/parseJsonBody.ts";

const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

interface SendRequest {
  to: string;
  subject: string;
  body_html: string;
  body_text?: string;
  contact_id?: number;
  project_id?: number;
  sales_id: number;
  tracking_id?: string;
}

import { base64UrlEncode } from "../_shared/encoding.ts";
import { injectTracking, buildRawEmail } from "../_shared/emailUtils.ts";

Deno.serve(async (req: Request) => {
  const earlyResponse = requirePost(req);
  if (earlyResponse) return earlyResponse;

  const parsed = await parseJsonBody<SendRequest>(req);
  if (!parsed.ok) return parsed.response;
  const { to, subject, body_html, body_text, contact_id, project_id, sales_id, tracking_id } = parsed.data;

  if (!to || !subject || !body_html || !sales_id) {
    return createErrorResponse(400, "to, subject, body_html, and sales_id are required");
  }

  // Find email account for this sales rep
  const { data: account, error: accError } = await supabaseAdmin
    .from("email_accounts")
    .select("*")
    .eq("sales_id", sales_id)
    .limit(1)
    .single();

  if (!account || accError) {
    return createErrorResponse(404, "No connected Gmail account found for this user. Connect one in Settings.");
  }

  try {
    const validToken = await getValidGmailToken(
      account.id,
      account.access_token,
      account.refresh_token,
      account.token_expires_at,
    );

    const finalHtml = tracking_id
      ? injectTracking(body_html, tracking_id)
      : body_html;

    const rawEmail = buildRawEmail(
      account.email_address,
      to,
      subject,
      finalHtml,
      body_text,
    );

    const encodedMessage = base64UrlEncode(rawEmail);

    interface GmailSendResponse {
      id?: string;
      threadId?: string;
      error?: { message?: string };
    }

    const result = await fetchJson<GmailSendResponse>(GMAIL_SEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!result.ok) {
      const gmailResult = result.data as GmailSendResponse;
      console.error("Gmail send error:", gmailResult);
      return createErrorResponse(500, `Gmail send failed: ${gmailResult.error?.message ?? "unknown error"}`);
    }

    const gmailResult = result.data;

    await logCommunication({
      contact_id: contact_id ?? null,
      project_id: project_id ?? null,
      channel: "email",
      direction: "outbound",
      subject,
      content_summary: body_html.replace(/<[^>]*>/g, "").substring(0, 500),
      external_id: gmailResult.id,
      metadata: {
        gmail_message_id: gmailResult.id,
        gmail_thread_id: gmailResult.threadId,
        from: account.email_address,
        to,
      },
    });

    return createJsonResponse({
      success: true,
      message_id: gmailResult.id,
      thread_id: gmailResult.threadId,
    });
  } catch (err) {
    console.error("gmail-send error:", err);
    return createErrorResponse(500, (err as Error).message);
  }
});
