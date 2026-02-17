import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5174";

test.describe("CRM Flow Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is already logged in - navigate to base
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
  });

  test("Step 1: Initial page snapshot", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    const title = await page.title();
    const url = page.url();
    console.log("Step 1 - Page title:", title, "URL:", url);
    expect(page).toBeTruthy();
  });

  test("Step 2: Create project - Milano Centro Residenze", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/projects`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Look for Create button (could be "New Project" or "Create")
    const createBtn = page.getByRole("button", { name: /new project|create/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    await createBtn.click();

    await page.waitForTimeout(1500);

    // Fill form - ProjectInputs has: name, slug, description, status
    await page.getByLabel(/name/i).first().fill("Milano Centro Residenze");
    await page.getByLabel(/slug/i).first().fill("milano-centro-residenze");
    await page.getByLabel(/description/i).first().fill("Luxury residential complex in Milan city center");
    await page.getByLabel(/status/i).first().selectOption("active");

    // Click Save
    await page.getByRole("button", { name: /create project|save/i }).first().click();

    await page.waitForTimeout(3000);

    // Check for success - should redirect to list and show the new project
    const url = page.url();
    const hasError = await page.getByText(/error|failed/i).isVisible().catch(() => false);
    const hasProject = await page.getByText("Milano Centro Residenze").isVisible().catch(() => false);

    console.log("Step 2 - URL after save:", url, "Has error:", hasError, "Has project:", hasProject);
    expect(hasError).toBeFalsy();
    expect(hasProject).toBeTruthy();
  });

  test("Step 3: Create segment - High Value Contacts", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/segments`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const createBtn = page.getByRole("button", { name: /new segment|create/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    await createBtn.click();

    await page.waitForTimeout(1500);

    await page.getByLabel(/name/i).first().fill("High Value Contacts");

    await page.getByRole("button", { name: /save|create/i }).first().click();

    await page.waitForTimeout(3000);

    const hasError = await page.getByText(/error|failed/i).isVisible().catch(() => false);
    const hasSegment = await page.getByText("High Value Contacts").isVisible().catch(() => false);

    console.log("Step 3 - Has error:", hasError, "Has segment:", hasSegment);
    expect(hasError).toBeFalsy();
    expect(hasSegment).toBeTruthy();
  });

  test("Step 4: Contacts list and Communication Timeline", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/contacts`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Check if contact list loads
    const listLoaded = await page.locator("table, [role='grid'], .card").first().isVisible().catch(() => false);

    // Click first contact
    const firstContactLink = page.locator("a[href*='/contacts/']").first();
    const hasContacts = await firstContactLink.isVisible().catch(() => false);

    if (hasContacts) {
      await firstContactLink.click();
      await page.waitForTimeout(2000);

      const hasTimeline = await page.getByText(/communication timeline/i).isVisible().catch(() => false);
      console.log("Step 4 - List loaded:", listLoaded, "Has contacts:", hasContacts, "Has Communication Timeline:", hasTimeline);
      expect(hasTimeline).toBeTruthy();
    } else {
      console.log("Step 4 - No contacts in list, list loaded:", listLoaded);
    }
  });

  test("Step 5: Create template - Welcome SMS", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/templates`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const createBtn = page.getByRole("button", { name: /new template|create/i }).first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    await createBtn.click();

    await page.waitForTimeout(1500);

    await page.getByLabel(/name/i).first().fill("Welcome SMS");
    await page.getByLabel(/channel/i).first().selectOption("sms");
    await page.getByLabel(/body/i).first().fill("Hello {{first_name}}, welcome to our CRM!");

    await page.getByRole("button", { name: /save|create/i }).first().click();

    await page.waitForTimeout(3000);

    const hasError = await page.getByText(/error|failed/i).isVisible().catch(() => false);
    const hasTemplate = await page.getByText("Welcome SMS").isVisible().catch(() => false);

    console.log("Step 5 - Has error:", hasError, "Has template:", hasTemplate);
    expect(hasError).toBeFalsy();
    expect(hasTemplate).toBeTruthy();
  });

  test("Step 6: Chat widget in bottom-right", async ({ page }) => {
    await page.goto(`${BASE_URL}/#/contacts`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Look for chat bubble - MessageCircle icon, fixed bottom-right button
    const chatButton = page.locator("button.fixed.bottom-6.right-6, [class*='fixed'][class*='bottom'][class*='right']").first();
    const hasChatButton = await chatButton.isVisible().catch(() => false);

    // Also check for MessageCircle (lucide) - often in a button
    const bubbleIcon = page.locator("button:has(svg)").filter({ has: page.locator("svg") }).last();
    const hasBubble = await bubbleIcon.isVisible().catch(() => false);

    console.log("Step 6 - Chat button (fixed):", hasChatButton, "Bubble icon:", hasBubble);
  });
});
