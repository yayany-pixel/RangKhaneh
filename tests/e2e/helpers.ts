import { test as base, expect, type Page } from "@playwright/test";

/**
 * E2E requires a live Supabase project, storage bucket, and an allowlisted test
 * user with a password. Provide these via environment variables:
 *
 *   E2E_BASE_URL       (default http://localhost:3000)
 *   E2E_TEST_EMAIL     an allowlisted user that exists in auth.users
 *   E2E_TEST_PASSWORD  that user's password
 *
 * Without them the suite is skipped rather than failing spuriously.
 */
export const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "";
export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";

export const hasCredentials = Boolean(TEST_EMAIL && TEST_PASSWORD);

export async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/home/, { timeout: 30_000 });
}

export const test = base;
export { expect };
