import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { createErrorResponse } from "../_shared/utils.ts";

// 1x1 transparent GIF
const TRACKING_PIXEL = Uint8Array.from(
  atob(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  ),
  (c) => c.charCodeAt(0),
);

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const trackingId = url.searchParams.get("t");
  const type = url.searchParams.get("type");
  const redirectUrl = url.searchParams.get("url");

  if (!trackingId || !type) {
    return createErrorResponse(400, "Missing parameters");
  }

  const now = new Date().toISOString();

  if (type === "open") {
    // Update opened_at on campaign_sends (only first open)
    await supabaseAdmin
      .from("campaign_sends")
      .update({ opened_at: now })
      .eq("tracking_id", trackingId)
      .is("opened_at", null);

    return new Response(TRACKING_PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  }

  if (type === "click" && redirectUrl) {
    // Update clicked_at on campaign_sends (only first click)
    await supabaseAdmin
      .from("campaign_sends")
      .update({ clicked_at: now })
      .eq("tracking_id", trackingId)
      .is("clicked_at", null);

    // Redirect to the actual URL
    const decoded = decodeURIComponent(redirectUrl);
    return new Response(null, {
      status: 302,
      headers: { Location: decoded },
    });
  }

  return createErrorResponse(400, "Unknown type");
});
