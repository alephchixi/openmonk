import { defineConfig, devices } from "@playwright/test";

const port = 4455;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
    launchOptions: process.env.PLAYWRIGHT_CHROME_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROME_EXECUTABLE_PATH }
      : undefined,
  },
  webServer: {
    command: "npm run start:e2e",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
