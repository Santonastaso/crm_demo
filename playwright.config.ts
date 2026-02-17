import { defineConfig, devices } from "@playwright/test";

const useAuth = !!process.env.LOGIN_EMAIL && !!process.env.LOGIN_PASSWORD;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5174",
    traceOnFirstRetry: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      testMatch: /crm.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: useAuth ? "e2e/.auth/user.json" : undefined,
      },
      dependencies: useAuth ? ["setup"] : [],
    },
  ],
  timeout: 30000,
});
