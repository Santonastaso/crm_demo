import { invokeEdgeFunction } from "../_shared/invokeFunction.ts";
import { primaryEmail, primaryPhone } from "../_shared/contactUtils.ts";

export async function sendViaChannel(
  channel: string,
  contact: Record<string, any>,
  message: string,
  subject: string | null,
  _campaignId: number,
  projectId: number | null,
  salesId: number | null,
): Promise<{ status: string; external_id?: string; tracking_id?: string }> {
  const contactId = contact.id;

  if (channel === "whatsapp" || channel === "sms") {
    const phone = primaryPhone(contact);
    if (!phone) return { status: "failed" };

    const fn = channel === "whatsapp" ? "whatsapp-send" : "sms-send";
    const response = await invokeEdgeFunction(fn, {
      to: phone,
      message,
      contact_id: contactId,
      project_id: projectId,
    });

    const result = await response.json();
    if (!response.ok) return { status: "failed" };
    return {
      status: "sent",
      external_id: result.wa_message_id ?? result.sms_sid,
    };
  }

  if (channel === "email") {
    const email = primaryEmail(contact);
    if (!email) return { status: "failed" };

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
      return {
        status: "sent",
        external_id: result.message_id,
        tracking_id: trackingId,
      };
    }
    return { status: "failed" };
  }

  return { status: "failed" };
}
