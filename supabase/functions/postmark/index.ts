import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { addNoteToContact } from "./addNoteToContact.ts";
import { extractMailContactData } from "./extractMailContactData.ts";
import { getExpectedAuthorization } from "./getExpectedAuthorization.ts";
import { getNoteContent } from "./getNoteContent.ts";
import { createErrorResponse, createJsonResponse } from "../_shared/utils.ts";

const webhookUser = Deno.env.get("POSTMARK_WEBHOOK_USER");
const webhookPassword = Deno.env.get("POSTMARK_WEBHOOK_PASSWORD");
if (!webhookUser || !webhookPassword) {
  throw new Error(
    "Missing POSTMARK_WEBHOOK_USER or POSTMARK_WEBHOOK_PASSWORD env variable",
  );
}

const rawAuthorizedIPs = Deno.env.get("POSTMARK_WEBHOOK_AUTHORIZED_IPS");
if (!rawAuthorizedIPs) {
  throw new Error("Missing POSTMARK_WEBHOOK_AUTHORIZED_IPS env variable");
}

Deno.serve(async (req) => {
  let response: Response | undefined;

  response = checkRequestTypeAndHeaders(req);
  if (response) return response;

  const json = await req.json();
  response = checkBody(json);
  if (response) return response;

  const { ToFull, FromFull, Subject, TextBody } = json;

  const noteContent = getNoteContent(Subject, TextBody);

  const { Email: salesEmail } = FromFull;
  if (!salesEmail) {
    // 403 tells Postmark not to retry this request
    return createErrorResponse(403, `Could not extract sales email from FromFull: ${FromFull}`);
  }

  const contacts = extractMailContactData(ToFull);

  for (const { firstName, lastName, email, domain } of contacts) {
    if (!email) {
      return createErrorResponse(403, `Could not extract email from ToFull: ${ToFull}`);
    }

    await addNoteToContact({
      salesEmail,
      email,
      domain,
      firstName,
      lastName,
      noteContent,
    });
  }

  return createJsonResponse({ status: "ok" });
});

const checkRequestTypeAndHeaders = (req: Request) => {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return createErrorResponse(401, "Unauthorized");
  }
  const ips = forwardedFor.split(",").map((ip) => ip.trim());
  const authorizedIPs = rawAuthorizedIPs.split(",").map((ip) => ip.trim());
  if (!ips.some((ip) => authorizedIPs.includes(ip))) {
    return createErrorResponse(401, "Unauthorized");
  }

  if (req.method !== "POST") {
    return createErrorResponse(405, "Method Not Allowed");
  }

  const expectedAuthorization = getExpectedAuthorization(webhookUser, webhookPassword);
  const authorization = req.headers.get("Authorization");
  if (authorization !== expectedAuthorization) {
    return createErrorResponse(401, "Unauthorized");
  }
};

// deno-lint-ignore no-explicit-any
const checkBody = (json: any) => {
  const { ToFull, FromFull, Subject, TextBody } = json;
  // 403 tells Postmark not to retry
  if (!ToFull || !ToFull.length)
    return createErrorResponse(403, "Missing parameter: ToFull");
  if (!FromFull)
    return createErrorResponse(403, "Missing parameter: FromFull");
  if (!Subject)
    return createErrorResponse(403, "Missing parameter: Subject");
  if (!TextBody)
    return createErrorResponse(403, "Missing parameter: TextBody");
};
