import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createErrorResponse, createJsonResponse } from "../_shared/utils.ts";
import { requirePost } from "../_shared/requestHandler.ts";
import { invokeEdgeFunction } from "../_shared/invokeFunction.ts";
import { renderTemplate } from "../_shared/templateUtils.ts";
import { sendViaChannel } from "./channels.ts";
import { parseJsonBody } from "../_shared/parseJsonBody.ts";
import { fetchEntityOr404 } from "../_shared/fetchEntityOr404.ts";

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email_jsonb: Array<{ email: string; type: string }>;
  phone_jsonb: Array<{ number: string; type: string }>;
  [key: string]: unknown;
}

interface StepRow {
  id: number;
  step_order: number;
  channel: string;
  template_content: { subject?: string; body?: string };
  delay_hours: number;
  condition: { type?: string } | string;
}

Deno.serve(async (req: Request) => {
  const earlyResponse = requirePost(req);
  if (earlyResponse) return earlyResponse;

  const parsed = await parseJsonBody<{ campaign_id?: number; step_number?: number }>(req);
  if (!parsed.ok) return parsed.response;
  const { campaign_id, step_number } = parsed.data;

  if (!campaign_id) {
    return createErrorResponse(400, "campaign_id is required");
  }

  const result = await fetchEntityOr404("campaigns", campaign_id, "Campaign");
  if (result.response) return result.response;
  const campaign = result.data as Record<string, unknown>;

  if (campaign.status !== "draft" && campaign.status !== "scheduled" && campaign.status !== "sending") {
    return createErrorResponse(400, `Campaign status is '${campaign.status}', cannot send`);
  }

  await supabaseAdmin
    .from("campaigns")
    .update({ status: "sending" })
    .eq("id", campaign_id);

  try {
    await invokeEdgeFunction("segments-refresh", { segment_id: campaign.segment_id });
  } catch (refreshErr) {
    console.error("Segment refresh before send failed:", refreshErr);
  }

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

    return createJsonResponse({ campaign_id, contacts_sent: 0, status: "completed" });
  }

  const { data: contacts } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .in("id", contactIds);

  // Get ALL campaign steps
  const { data: allSteps } = await supabaseAdmin
    .from("campaign_steps")
    .select("*")
    .eq("campaign_id", campaign_id)
    .order("step_order", { ascending: true });

  const steps: StepRow[] = (allSteps ?? []) as StepRow[];

  // If no steps, fall back to template
  if (steps.length === 0 && campaign.template_id) {
    const { data: template } = await supabaseAdmin
      .from("templates")
      .select("*")
      .eq("id", campaign.template_id)
      .single();

    if (template) {
      steps.push({
        id: 0,
        step_order: 1,
        channel: (template.channel as string) ?? (campaign.channel as string),
        template_content: { body: template.body ?? "", subject: template.subject ?? "" },
        delay_hours: 0,
        condition: "always",
      });
    }
  }

  // Determine which steps to process
  const targetStep = step_number ?? 1;
  const stepsToProcess = steps.filter((s) => s.step_order <= targetStep);

  // For the current step, filter contacts by condition
  let totalSent = 0;

  for (const step of stepsToProcess) {
    // Only send for the target step; earlier steps should already be sent
    if (step.step_order < targetStep) continue;

    let eligibleContacts: Contact[] = contacts ?? [];

    // Apply condition filtering based on previous step results
    if (step.step_order > 1) {
      const conditionType =
        typeof step.condition === "string"
          ? step.condition
          : step.condition?.type ?? "always";

      if (conditionType !== "always") {
        const prevStep = steps.find((s) => s.step_order === step.step_order - 1);
        if (prevStep) {
          const { data: prevSends } = await supabaseAdmin
            .from("campaign_sends")
            .select("contact_id, status, opened_at, clicked_at")
            .eq("campaign_id", campaign_id)
            .eq("step_id", prevStep.id);

          const prevSendMap = new Map(
            (prevSends ?? []).map((s: Record<string, unknown>) => [s.contact_id, s]),
          );

          eligibleContacts = eligibleContacts.filter((c) => {
            const prev = prevSendMap.get(c.id) as Record<string, unknown> | undefined;
            if (!prev) return false;

            switch (conditionType) {
              case "if_opened":
                return !!prev.opened_at;
              case "if_not_opened":
                return !prev.opened_at;
              case "if_clicked":
                return !!prev.clicked_at;
              case "if_not_clicked":
                return !prev.clicked_at;
              default:
                return true;
            }
          });
        }
      }
    }

    const bodyTemplate = step.template_content?.body ?? "";
    const subjectTemplate = step.template_content?.subject ?? "";
    const channel = step.channel ?? (campaign.channel as string);

    for (const contact of eligibleContacts) {
      const renderedBody = renderTemplate(bodyTemplate, contact);
      const renderedSubject = renderTemplate(subjectTemplate, contact);

      const sendResult = await sendViaChannel(
        channel,
        contact,
        renderedBody,
        renderedSubject,
        campaign_id,
        campaign.project_id as number | undefined,
        campaign.sales_id as number | undefined,
      );

      const sendRow: Record<string, unknown> = {
        campaign_id,
        step_id: step.id || null,
        contact_id: contact.id,
        channel,
        status: sendResult.status,
        sent_at: sendResult.status === "sent" ? new Date().toISOString() : null,
        external_id: sendResult.external_id ?? null,
      };

      if (sendResult.tracking_id) {
        sendRow.tracking_id = sendResult.tracking_id;
      }

      await supabaseAdmin.from("campaign_sends").insert(sendRow);

      if (sendResult.status === "sent") totalSent++;
    }
  }

  // If we processed the last step, mark campaign as completed
  const lastStep = steps[steps.length - 1];
  if (!lastStep || targetStep >= lastStep.step_order) {
    await supabaseAdmin
      .from("campaigns")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", campaign_id);
  }

  return createJsonResponse({
    campaign_id,
    step_processed: targetStep,
    total_steps: steps.length,
    contacts_total: contacts?.length ?? 0,
    contacts_sent: totalSent,
    status: targetStep >= (lastStep?.step_order ?? 1) ? "completed" : "step_completed",
  });
});
