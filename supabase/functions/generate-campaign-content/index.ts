import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, createErrorResponse, createJsonResponse } from "../_shared/utils.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { fetchJson } from "../_shared/fetchJson.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return createErrorResponse(405, "Method Not Allowed");
  }

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!anthropicKey) {
    return createErrorResponse(500, "ANTHROPIC_API_KEY not configured");
  }

  const body = await req.json();
  const { channel, segment_id, project_id, tone, language } = body;

  if (!channel) {
    return createErrorResponse(400, "channel is required");
  }

  // Load segment info if provided
  let segmentContext = "";
  if (segment_id) {
    const { data: segment } = await supabaseAdmin
      .from("segments")
      .select("name, criteria")
      .eq("id", segment_id)
      .single();

    if (segment) {
      segmentContext = `Target segment: "${segment.name}". Criteria: ${JSON.stringify(segment.criteria)}.`;

      // Load sample contacts from segment
      const { data: segmentContacts } = await supabaseAdmin
        .from("segment_contacts")
        .select("contact_id")
        .eq("segment_id", segment_id)
        .limit(5);

      if (segmentContacts && segmentContacts.length > 0) {
        const contactIds = segmentContacts.map((sc) => sc.contact_id);
        const { data: contacts } = await supabaseAdmin
          .from("contacts")
          .select("first_name, last_name, lead_type, background")
          .in("id", contactIds);

        if (contacts && contacts.length > 0) {
          segmentContext += ` Sample contacts: ${JSON.stringify(contacts.map((c) => ({
            name: `${c.first_name} ${c.last_name}`,
            lead_type: c.lead_type,
            background: c.background?.substring(0, 100),
          })))}`;
        }
      }
    }
  }

  // Load project info if provided
  let projectContext = "";
  if (project_id) {
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("name, description, location, status")
      .eq("id", project_id)
      .single();

    if (project) {
      projectContext = `Project: "${project.name}" in ${project.location ?? "Italia"}. ${project.description ?? ""}`;
    }

    // Load some property units
    const { data: units } = await supabaseAdmin
      .from("property_units")
      .select("typology, square_meters, current_price, status")
      .eq("project_id", project_id)
      .eq("status", "disponibile")
      .limit(5);

    if (units && units.length > 0) {
      projectContext += ` Available units: ${JSON.stringify(units)}`;
    }
  }

  const channelInstructions: Record<string, string> = {
    email: "Generate an email with subject line and HTML body. Use {{first_name}} and {{last_name}} as merge tags. Keep it professional yet warm. Include a clear call-to-action.",
    whatsapp: "Generate a WhatsApp message. Keep it concise (under 1000 chars). Use {{first_name}} as merge tag. Informal but professional tone. No HTML.",
    sms: "Generate an SMS message. Maximum 160 characters. Use {{first_name}} as merge tag. Very concise with a clear CTA.",
  };

  const systemPrompt = `You are a marketing content specialist for Arte di Abitare, part of Industrie Edili Holding — an Italian real estate developer. Generate campaign content in ${language ?? "Italian"}.

${projectContext}
${segmentContext}

Channel: ${channel}
${channelInstructions[channel] ?? channelInstructions.email}

${tone ? `Tone: ${tone}` : "Tone: professional, warm, inviting"}

Respond in valid JSON with this structure:
{
  "subject": "email subject line (only for email channel, omit for others)",
  "body": "the message content"
}

Do not include any text outside the JSON object.`;

  const fetchResult = await fetchJson<Record<string, unknown>>(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate a ${channel} campaign message for this segment${project_id ? " about this project" : ""}. Make it compelling and specific to the target audience.`,
        },
      ],
    }),
  });

  if (!fetchResult.ok) {
    return createErrorResponse(502, "Failed to generate content");
  }

  const result = fetchResult.data;
  const content = (result.content as Array<{ type: string; text: string }>)?.[0]?.text ?? "";

  try {
    const parsed = JSON.parse(content);
    return createJsonResponse(parsed);
  } catch {
    return createJsonResponse({ body: content });
  }
});
