import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { addNoteToContact } from "./addNoteToContact.ts";
import { extractMailContactData } from "./extractMailContactData.ts";
import { getExpectedAuthorization } from "./getExpectedAuthorization.ts";
import { getNoteContent } from "./getNoteContent.ts";

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
    // Return a 403 to let Postmark know that it's no use to retry this request
    // https://postmarkapp.com/developer/webhooks/inbound-webhook#errors-and-retries
    return new Response(
      `Could not extract sales email from FromFull: ${FromFull}`,
      { status: 403 },
    );
  }

  const contacts = extractMailContactData(ToFull);

  for (const { firstName, lastName, email, domain } of contacts) {
    if (!email) {
      // Return a 403 to let Postmark know that it's no use to retry this request
      // https://postmarkapp.com/developer/webhooks/inbound-webhook#errors-and-retries
      return new Response(`Could not extract email from ToFull: ${ToFull}`, {
        status: 403,
      });
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

  return new Response("OK");
});

const checkRequestTypeAndHeaders = (req: Request) => {
  // Only allow known IP addresses
  // We can use the x-forwarded-for header as it is populated by Supabase
  // https://supabase.com/docs/guides/api/securing-your-api#accessing-request-information
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return new Response("Unauthorized", { status: 401 });
  }
  const ips = forwardedFor.split(",").map((ip) => ip.trim());
  const authorizedIPs = rawAuthorizedIPs.split(",").map((ip) => ip.trim());
  if (!ips.some((ip) => authorizedIPs.includes(ip))) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  // Check the Authorization header
  const expectedAuthorization = getExpectedAuthorization(
    webhookUser,
    webhookPassword,
  );
  const authorization = req.headers.get("Authorization");
  if (authorization !== expectedAuthorization) {
    return new Response("Unauthorized", { status: 401 });
  }
};

// deno-lint-ignore no-explicit-any
const checkBody = (json: any) => {
  const { ToFull, FromFull, Subject, TextBody } = json;

  // In case of incorrect request data, we
  // return a 403 to let Postmark know that it's no use to retry this request
  // https://postmarkapp.com/developer/webhooks/inbound-webhook#errors-and-retries
  if (!ToFull || !ToFull.length)
    return new Response("Missing parameter: ToFull", { status: 403 });
  if (!FromFull)
    return new Response("Missing parameter: FromFull", { status: 403 });
  if (!Subject)
    return new Response("Missing parameter: Subject", { status: 403 });
  if (!TextBody)
    return new Response("Missing parameter: TextBody", {
      status: 403,
    });
};
