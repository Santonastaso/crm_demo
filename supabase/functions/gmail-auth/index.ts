import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { corsHeaders, createErrorResponse, createJsonResponse } from "../_shared/utils.ts";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

function getOAuthConfig() {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const redirectUri = `${supabaseUrl}/functions/v1/gmail-auth?action=callback`;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET must be set");
  }

  return { clientId, clientSecret, redirectUri };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Step 1: Redirect user to Google OAuth consent screen
  if (action === "authorize") {
    try {
      const { clientId, redirectUri } = getOAuthConfig();
      const salesId = url.searchParams.get("sales_id");

      if (!salesId) {
        return createErrorResponse(400, "sales_id query param is required");
      }

      const state = btoa(JSON.stringify({ sales_id: salesId }));

      const authUrl = new URL(GOOGLE_AUTH_URL);
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", SCOPES);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", state);

      return new Response(null, {
        status: 302,
        headers: { Location: authUrl.toString(), ...corsHeaders },
      });
    } catch (err) {
      return createErrorResponse(500, (err as Error).message);
    }
  }

  // Step 2: Handle OAuth callback from Google
  if (action === "callback") {
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return createErrorResponse(400, `OAuth error: ${error}`);
    }

    if (!code || !stateParam) {
      return createErrorResponse(400, "Missing code or state parameter");
    }

    let salesId: string;
    try {
      const parsed = JSON.parse(atob(stateParam));
      salesId = parsed.sales_id;
    } catch {
      return createErrorResponse(400, "Invalid state parameter");
    }

    try {
      const { clientId, clientSecret, redirectUri } = getOAuthConfig();

      // Exchange authorization code for tokens
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error("Token exchange failed:", tokenData);
        return createErrorResponse(500, `Token exchange failed: ${tokenData.error_description ?? tokenData.error}`);
      }

      const accessToken: string = tokenData.access_token;
      const refreshToken: string = tokenData.refresh_token;
      const expiresIn: number = tokenData.expires_in ?? 3600;
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      // Get user email from Google
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userInfo = await userInfoRes.json();
      const emailAddress: string = userInfo.email;

      if (!emailAddress) {
        return createErrorResponse(500, "Could not retrieve email address from Google");
      }

      // Upsert into email_accounts
      const { error: dbError } = await supabaseAdmin
        .from("email_accounts")
        .upsert(
          {
            sales_id: parseInt(salesId, 10),
            email_address: emailAddress,
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expires_at: expiresAt,
          },
          { onConflict: "email_address" },
        );

      if (dbError) {
        console.error("DB upsert error:", dbError);
        return createErrorResponse(500, `Failed to save email account: ${dbError.message}`);
      }

      // Redirect back to CRM settings page
      const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "http://localhost:5173";
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${frontendUrl}/#/settings/email?connected=${encodeURIComponent(emailAddress)}`,
          ...corsHeaders,
        },
      });
    } catch (err) {
      console.error("OAuth callback error:", err);
      return createErrorResponse(500, (err as Error).message);
    }
  }

  // Step 3: Disconnect — delete an email account
  if (req.method === "POST") {
    const body = await req.json();
    const { action: postAction, email_account_id } = body;

    if (postAction === "disconnect" && email_account_id) {
      const { error: delError } = await supabaseAdmin
        .from("email_accounts")
        .delete()
        .eq("id", email_account_id);

      if (delError) {
        return createErrorResponse(500, delError.message);
      }

      return createJsonResponse({ success: true });
    }

    return createErrorResponse(400, "Invalid action");
  }

  return createErrorResponse(400, "Unknown action. Use ?action=authorize or ?action=callback");
});
