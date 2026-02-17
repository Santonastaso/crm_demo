import { test as setup } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const authFile = "e2e/.auth/user.json";
const BASE_URL = "http://localhost:5174";

setup("authenticate", async ({ page }) => {
  const email = process.env.LOGIN_EMAIL;
  const password = process.env.LOGIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "LOGIN_EMAIL and LOGIN_PASSWORD env vars not set. Skipping auth setup."
    );
    return;
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto(BASE_URL);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);

  const urlBefore = page.url();
  if (!urlBefore.includes("login") && !urlBefore.includes("sign-up")) {
    await page.context().storageState({ path: authFile });
    return;
  }

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForTimeout(5000);
  await page.context().storageState({ path: authFile });
});
