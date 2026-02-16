import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, createErrorResponse } from "../_shared/utils.ts";
import { getValidGmailToken } from "../_shared/gmailToken.ts";
import { logCommunication } from "../_shared/communicationLog.ts";
import { requirePost } from "../_shared/requestHandler.ts";

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

function injectTracking(html: string, trackingId: string): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const trackBase = `${supabaseUrl}/functions/v1/email-track`;

  // Inject open tracking pixel before closing </div> or at end
  const pixel = `<img src="${trackBase}?t=${trackingId}&type=open" width="1" height="1" style="display:none" alt="" />`;

  // Wrap links for click tracking
  const withLinks = html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_match, url) => {
      const encoded = encodeURIComponent(url);
      return `href="${trackBase}?t=${trackingId}&type=click&url=${encoded}"`;
    },
  );

  return withLinks + pixel;
}

function buildRawEmail(
  from: string,
  to: string,
  subject: string,
  bodyHtml: string,
  bodyText?: string,
): string {
  const boundary = "boundary_" + crypto.randomUUID().replace(/-/g, "");
  const plainText = bodyText ?? bodyHtml.replace(/<[^>]*>/g, "");

  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    btoa(unescape(encodeURIComponent(plainText))),
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    btoa(unescape(encodeURIComponent(bodyHtml))),
    "",
    `--${boundary}--`,
  ];

  return lines.join("\r\n");
}

function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

Deno.serve(async (req: Request) => {
  const earlyResponse = requirePost(req);
  if (earlyResponse) return earlyResponse;

  const body: SendRequest = await req.json();
  const { to, subject, body_html, body_text, contact_id, project_id, sales_id, tracking_id } = body;

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

    const gmailResponse = await fetch(GMAIL_SEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${validToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    const gmailResult = await gmailResponse.json();

    if (!gmailResponse.ok) {
      console.error("Gmail send error:", gmailResult);
      return createErrorResponse(500, `Gmail send failed: ${gmailResult.error?.message ?? "unknown error"}`);
    }

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

    return new Response(
      JSON.stringify({
        success: true,
        message_id: gmailResult.id,
        thread_id: gmailResult.threadId,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err) {
    console.error("gmail-send error:", err);
    return createErrorResponse(500, (err as Error).message);
  }
});
