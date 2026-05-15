import { expect, test } from "@playwright/test";

test("slash commands start the requested sessions", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#mode-bell")).toHaveCount(0);
  await expect(page.locator("#mode-still")).toHaveCount(0);

  await page.getByLabel("Command input").fill("/zen 1");
  await page.getByLabel("Command input").press("Enter");

  await expect(page.locator(".session-status")).toHaveText("Silence begins.");
  await expect(page.locator(".session-timer")).toHaveText("01:00");
  await expect(page.locator("#stop-btn")).toBeVisible();
  await expect(page.locator(".glyph")).toHaveText("◌");

  await page.locator("#stop-btn").click();
  await expect(page.locator(".session-status")).toHaveText("Stopped.");
});

test("invalid commands fail inline without starting a session", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Command input").fill("/dance");
  await page.getByLabel("Command input").press("Enter");

  await expect(page.locator(".command-error")).toHaveText("Unknown mode: dance.");
  await expect(page.locator("#begin-btn")).toBeVisible();
});

test("removed commands fail inline", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Command input").fill("/bell");
  await page.getByLabel("Command input").press("Enter");

  await expect(page.locator(".command-error")).toHaveText("Unknown mode: bell.");
  await expect(page.locator("#begin-btn")).toBeVisible();
});

test("info dialog is keyboard accessible", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "OpenMonk" }).click();
  await expect(page.getByRole("dialog", { name: "OpenMonk" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "OpenMonk" })).toBeHidden();
});

test("mobile layout avoids horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await page.locator("#provider-elevenlabs").click();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("Spanish toggle translates visible UI", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Switch interface to Spanish" }).click();

  await expect(page.locator(".param-label").first()).toHaveText("Duracion");
  await expect(page.locator("#begin-btn")).toHaveText("Comenzar");
  await expect(page.locator("#mute-btn")).toHaveText("Silenciar");
  await expect(page.locator("#mode-air")).toHaveText("Aire");

  await page.getByLabel("Entrada de comando").fill("/zen 1");
  await page.getByLabel("Entrada de comando").press("Enter");
  await expect(page.locator(".session-status")).toHaveText("Comienza el silencio.");
});

test("reduced motion disables active glyph animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await page.locator("#mode-om").click();
  await page.locator("#begin-btn").click();
  await expect(page.locator(".session-status")).toHaveText("Preparing.");

  const animationName = await page.locator(".glyph").evaluate((node) => getComputedStyle(node).animationName);
  expect(animationName).toBe("none");
});
