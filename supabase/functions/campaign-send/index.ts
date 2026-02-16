import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createErrorResponse, createJsonResponse } from "../_shared/utils.ts";
import { requirePost } from "../_shared/requestHandler.ts";
import { invokeEdgeFunction } from "../_shared/invokeFunction.ts";
import { primaryEmail, primaryPhone } from "../_shared/contactUtils.ts";

function renderTemplate(
  template: string,
  contact: Record<string, any>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key === "first_name") return contact.first_name ?? "";
    if (key === "last_name") return contact.last_name ?? "";
    if (key === "email") {
      return primaryEmail(contact) ?? "";
    }
    if (key === "phone") {
      return primaryPhone(contact) ?? "";
    }
    return contact[key] ?? "";
  });
}

async function sendViaChannel(
  channel: string,
  contact: Record<string, any>,
  message: string,
  subject: string | null,
  campaignId: number,
  projectId: number | null,
  salesId: number | null,
): Promise<{ status: string; external_id?: string; tracking_id?: string }> {
  const contactId = contact.id;

  if (channel === "whatsapp") {
    const phone = primaryPhone(contact);
    if (!phone) return { status: "failed" };

    const response = await invokeEdgeFunction("whatsapp-send", {
      to: phone,
      message,
      contact_id: contactId,
      project_id: projectId,
    });

    const result = await response.json();
    return response.ok
      ? { status: "sent", external_id: result.wa_message_id }
      : { status: "failed" };
  }

  if (channel === "sms") {
    const phone = primaryPhone(contact);
    if (!phone) return { status: "failed" };

    const response = await invokeEdgeFunction("sms-send", {
      to: phone,
      message,
      contact_id: contactId,
      project_id: projectId,
    });

    const result = await response.json();
    return response.ok
      ? { status: "sent", external_id: result.sms_sid }
      : { status: "failed" };
  }

  if (channel === "email") {
    const email = primaryEmail(contact);
    if (!email) return { status: "failed" };

    // Generate tracking_id upfront for open/click tracking
    const trackingId = crypto.randomUUID();

    const response = await invokeEdgeFunction("gmail-send", {
      to: email,
      subject: subject ?? "No subject",
      body_html: `<div>${message.replace(/\n/g, "<br>")}</div>`,
      contact_id: contactId,
      project_id: projectId,
      sales_id: salesId,
      tracking_id: trackingId,
    });

    if (response.ok) {
      const result = await response.json();
      return { status: "sent", external_id: result.message_id, tracking_id: trackingId };
    }
    return { status: "failed" };
  }

  return { status: "failed" };
}

Deno.serve(async (req: Request) => {
  const earlyResponse = requirePost(req);
  if (earlyResponse) return earlyResponse;

  const { campaign_id } = await req.json();

  if (!campaign_id) {
    return createErrorResponse(400, "campaign_id is required");
  }

  // Fetch campaign
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("id", campaign_id)
    .single();

  if (!campaign || campaignError) {
    return createErrorResponse(404, "Campaign not found");
  }

  if (campaign.status !== "draft" && campaign.status !== "scheduled") {
    return createErrorResponse(400, `Campaign status is '${campaign.status}', cannot send`);
  }

  // Update status to sending
  await supabaseAdmin
    .from("campaigns")
    .update({ status: "sending" })
    .eq("id", campaign_id);

  try {
    await invokeEdgeFunction("segments-refresh", { segment_id: campaign.segment_id });
  } catch (refreshErr) {
    console.error("Segment refresh before send failed:", refreshErr);
  }

  // Get segment contacts
  const { data: segmentContacts } = await supabaseAdmin
    .from("segment_contacts")
    .select("contact_id")
    .eq("segment_id", campaign.segment_id);

  const contactIds = (segmentContacts ?? []).map(
    (sc: { contact_id: number }) => sc.contact_id,
  );

  if (contactIds.length === 0) {
    await supabaseAdmin
      .from("campaigns")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", campaign_id);

    return createJsonResponse({
      campaign_id,
      contacts_sent: 0,
      status: "completed",
    });
  }

  // Get full contact data
  const { data: contacts } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .in("id", contactIds);

  // Get first campaign step (MVP: single step)
  const { data: steps } = await supabaseAdmin
    .from("campaign_steps")
    .select("*")
    .eq("campaign_id", campaign_id)
    .order("step_order", { ascending: true })
    .limit(1);

  let step = steps?.[0];
  let bodyTemplate = "";
  let subjectTemplate = "";
  let channel = campaign.channel;

  if (step) {
    const templateContent = step.template_content ?? {};
    bodyTemplate = (templateContent as Record<string, string>).body ?? "";
    subjectTemplate = (templateContent as Record<string, string>).subject ?? "";
    channel = step.channel ?? campaign.channel;
  } else if (campaign.template_id) {
    const { data: template } = await supabaseAdmin
      .from("templates")
      .select("*")
      .eq("id", campaign.template_id)
      .single();
    if (template) {
      bodyTemplate = template.body ?? "";
      subjectTemplate = template.subject ?? "";
      channel = template.channel ?? campaign.channel;
    }
  }

  let sentCount = 0;

  for (const contact of contacts ?? []) {
    const renderedBody = renderTemplate(bodyTemplate, contact);
    const renderedSubject = renderTemplate(subjectTemplate, contact);

    const result = await sendViaChannel(
      channel,
      contact,
      renderedBody,
      renderedSubject,
      campaign_id,
      campaign.project_id,
      campaign.sales_id,
    );

    const sendRow: Record<string, unknown> = {
      campaign_id,
      step_id: step?.id ?? null,
      contact_id: contact.id,
      channel,
      status: result.status,
      sent_at: result.status === "sent" ? new Date().toISOString() : null,
      external_id: result.external_id ?? null,
    };

    // Use pre-generated tracking_id for email tracking
    if (result.tracking_id) {
      sendRow.tracking_id = result.tracking_id;
    }

    await supabaseAdmin.from("campaign_sends").insert(sendRow);

    if (result.status === "sent") sentCount++;
  }

  // Update campaign status
  await supabaseAdmin
    .from("campaigns")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", campaign_id);

  return createJsonResponse({
    campaign_id,
    contacts_total: contacts?.length ?? 0,
    contacts_sent: sentCount,
    status: "completed",
  });
});
