/**
 * Full CRM flow test - Steps 0-8
 * Run with: LOGIN_EMAIL=... LOGIN_PASSWORD=... npx playwright test e2e/crm-full-flow.spec.ts
 */
import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5174";
const LOGIN_EMAIL = process.env.LOGIN_EMAIL || "andreasantonastaso01@gmail.com";
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || "abcdef";

const results: Record<string, { success: boolean; details: string }> = {};

test.describe("CRM Full Flow (Steps 0-8)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
  });

  test("Step 0: Login", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const urlBefore = page.url();
    const hasLoginForm = await page.getByLabel(/email/i).isVisible().catch(() => false);

    if (hasLoginForm) {
      await page.getByLabel(/email/i).fill(LOGIN_EMAIL);
      await page.getByLabel(/password/i).fill(LOGIN_PASSWORD);
      await page.getByRole("button", { name: /sign in/i }).click();
      await page.waitForTimeout(3000);
    }

    const urlAfter = page.url();
    const stillOnLogin = urlAfter.includes("login") || urlAfter.includes("sign-up");
    const hasError = await page.getByText(/error|invalid|failed/i).first().isVisible().catch(() => false);

    results["Step 0: Login"] = {
      success: !stillOnLogin && !hasError,
      details: `URL before: ${urlBefore}, URL after: ${urlAfter}, Still on login: ${stillOnLogin}, Error visible: ${hasError}`,
    };
    expect(stillOnLogin).toBeFalsy();
  });

  test("Step 1: Dashboard", async ({ page }) => {
    // Login first
    const hasLogin = await page.getByLabel(/email/i).isVisible().catch(() => false);
    if (hasLogin) {
      await page.getByLabel(/email/i).fill(LOGIN_EMAIL);
      await page.getByLabel(/password/i).fill(LOGIN_PASSWORD);
      await page.getByRole("button", { name: /sign in/i }).click();
      await page.waitForTimeout(3000);
    }

    await page.waitForTimeout(2000);
    const navItems = await page.locator("nav a, [role='navigation'] a").allTextContents().catch(() => []);
    const dashboardContent = await page.locator("main, [role='main']").textContent().catch(() => "");
    const hasError = await page.getByText(/error/i).first().isVisible().catch(() => false);

    results["Step 1: Dashboard"] = {
      success: !hasError,
      details: `Nav items: ${navItems.slice(0, 15).join(", ")}. Content preview: ${dashboardContent?.slice(0, 200)}...`,
    };
  });

  test("Step 2: Projects - Create Milano Centro Residenze", async ({ page }) => {
    await doLogin(page);
    await page.goto(`${BASE_URL}/#/projects`);
    await page.waitForTimeout(2000);

    const createBtn = page.getByRole("button", { name: /new project|create/i }).first();
    const hasCreate = await createBtn.isVisible().catch(() => false);
    if (!hasCreate) {
      results["Step 2: Projects"] = { success: false, details: "Create button not found" };
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(1500);

    await page.getByLabel(/name/i).first().fill("Milano Centro Residenze");
    await page.getByLabel(/slug/i).first().fill("milano-centro-residenze");
    await page.getByLabel(/description/i).first().fill("Luxury residential complex");
    const statusSelect = page.getByLabel(/status/i).first();
    if (await statusSelect.isVisible().catch(() => false)) {
      await statusSelect.selectOption("active");
    }

    await page.getByRole("button", { name: /create project|save/i }).first().click();
    await page.waitForTimeout(3000);

    const hasError = await page.getByText(/error|failed/i).first().isVisible().catch(() => false);
    const hasProject = await page.getByText("Milano Centro Residenze").isVisible().catch(() => false);

    results["Step 2: Projects"] = {
      success: hasProject && !hasError,
      details: `Project created: ${hasProject}, Error: ${hasError}`,
    };
    expect(hasError).toBeFalsy();
    expect(hasProject).toBeTruthy();
  });

  test("Step 3: Segments - Create High Value Contacts", async ({ page }) => {
    await doLogin(page);
    await page.goto(`${BASE_URL}/#/segments`);
    await page.waitForTimeout(2000);

    const createBtn = page.getByRole("link", { name: /new segment/i }).first();
    await createBtn.click();
    await page.waitForTimeout(1500);

    await page.getByLabel(/name/i).first().fill("High Value Contacts");
    await page.getByRole("button", { name: /save|create/i }).first().click();
    await page.waitForTimeout(3000);

    const hasError = await page.getByText(/error|failed/i).first().isVisible().catch(() => false);
    const hasSegment = await page.getByText("High Value Contacts").isVisible().catch(() => false);

    results["Step 3: Segments"] = {
      success: hasSegment && !hasError,
      details: `Segment created: ${hasSegment}, Error: ${hasError}`,
    };
    expect(hasError).toBeFalsy();
    expect(hasSegment).toBeTruthy();
  });

  test("Step 4: Templates - Create Welcome SMS", async ({ page }) => {
    await doLogin(page);
    await page.goto(`${BASE_URL}/#/templates`);
    await page.waitForTimeout(2000);

    const createBtn = page.getByRole("link", { name: /new template/i }).first();
    await createBtn.click();
    await page.waitForTimeout(1500);

    await page.getByLabel(/name/i).first().fill("Welcome SMS");
    await page.getByLabel(/channel/i).first().selectOption("sms");
    await page.getByLabel(/body/i).first().fill("Hello, welcome to our CRM!");
    await page.getByRole("button", { name: /save|create/i }).first().click();
    await page.waitForTimeout(3000);

    const hasError = await page.getByText(/error|failed/i).first().isVisible().catch(() => false);
    const hasTemplate = await page.getByText("Welcome SMS").isVisible().catch(() => false);

    results["Step 4: Templates"] = {
      success: hasTemplate && !hasError,
      details: `Template created: ${hasTemplate}, Error: ${hasError}`,
    };
    expect(hasError).toBeFalsy();
    expect(hasTemplate).toBeTruthy();
  });

  test("Step 5: Contacts - List and Communication Timeline", async ({ page }) => {
    await doLogin(page);
    await page.goto(`${BASE_URL}/#/contacts`);
    await page.waitForTimeout(2000);

    const firstContact = page.locator("a[href*='/contacts/']").first();
    const hasContacts = await firstContact.isVisible().catch(() => false);

    let hasTimeline = false;
    if (hasContacts) {
      await firstContact.click();
      await page.waitForTimeout(2000);
      hasTimeline = await page.getByText(/communication timeline/i).isVisible().catch(() => false);
    }

    const listContent = await page.locator("main").textContent().catch(() => "");
    results["Step 5: Contacts"] = {
      success: true,
      details: `Has contacts: ${hasContacts}, Communication Timeline visible: ${hasTimeline}. Content: ${listContent?.slice(0, 150)}...`,
    };
  });

  test("Step 6: Chat Widget", async ({ page }) => {
    await doLogin(page);
    await page.goto(`${BASE_URL}/#/contacts`);
    await page.waitForTimeout(2000);

    const chatBtn = page.locator("button.fixed.bottom-6.right-6, button[class*='fixed']").first();
    const hasChat = await chatBtn.isVisible().catch(() => false);

    if (hasChat) {
      await chatBtn.click();
      await page.waitForTimeout(1000);
      const input = page.getByPlaceholder(/type|message/i).first();
      if (await input.isVisible().catch(() => false)) {
        await input.fill("Hello, I'm interested in a property");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(8000);
      }
    }

    results["Step 6: Chat Widget"] = {
      success: hasChat,
      details: `Chat widget found: ${hasChat}`,
    };
  });

  test("Step 7: Discovery", async ({ page }) => {
    await doLogin(page);
    await page.goto(`${BASE_URL}/#/discovery_scans`);
    await page.waitForTimeout(2000);

    const content = await page.locator("main").textContent().catch(() => "");
    const hasError = await page.getByText(/error|failed/i).first().isVisible().catch(() => false);

    results["Step 7: Discovery"] = {
      success: !hasError,
      details: `Content: ${content?.slice(0, 300)}...`,
    };
  });

  test("Step 8: Campaigns", async ({ page }) => {
    await doLogin(page);
    await page.goto(`${BASE_URL}/#/campaigns`);
    await page.waitForTimeout(2000);

    const content = await page.locator("main").textContent().catch(() => "");
    const hasError = await page.getByText(/error|failed/i).first().isVisible().catch(() => false);

    results["Step 8: Campaigns"] = {
      success: !hasError,
      details: `Content: ${content?.slice(0, 300)}...`,
    };
  });
});

async function doLogin(page: import("@playwright/test").Page) {
  const hasLogin = await page.getByLabel(/email/i).isVisible().catch(() => false);
  if (hasLogin) {
    await page.getByLabel(/email/i).fill(LOGIN_EMAIL);
    await page.getByLabel(/password/i).fill(LOGIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForTimeout(3000);
  }
}
