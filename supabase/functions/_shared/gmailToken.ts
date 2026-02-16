import { supabaseAdmin } from "./supabaseAdmin.ts";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function refreshGoogleAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");

  if (!clientId || !clientSecret) return null;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) return null;
  return await response.json();
}

export async function getValidGmailToken(
  accountId: number,
  accessToken: string,
  refreshToken: string,
  expiresAt: string | null,
): Promise<string> {
  const now = new Date();
  const expiry = expiresAt ? new Date(expiresAt) : new Date(0);

  if (now < expiry) {
    return accessToken;
  }

  const refreshed = await refreshGoogleAccessToken(refreshToken);
  if (!refreshed) {
    throw new Error("Failed to refresh Gmail access token");
  }

  const newExpiry = new Date(
    Date.now() + refreshed.expires_in * 1000,
  ).toISOString();

  await supabaseAdmin
    .from("email_accounts")
    .update({
      access_token: refreshed.access_token,
      token_expires_at: newExpiry,
    })
    .eq("id", accountId);

  return refreshed.access_token;
}
