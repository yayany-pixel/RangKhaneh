import { test, expect, hasCredentials } from "./helpers";

/**
 * Security boundary: authentication is the real protection. An anonymous
 * visitor must never reach app data or private attachments.
 */
test.describe("access control", () => {
  test("anonymous users are redirected away from the app", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login/);
  });

  test("anonymous users cannot reach the archive", async ({ page }) => {
    await page.goto("/archive");
    await expect(page).toHaveURL(/\/login/);
  });

  test("anonymous users cannot reach a private attachment", async ({ page }) => {
    const res = await page.request.get(
      "/api/attachments/00000000-0000-4000-8000-000000000000",
      { maxRedirects: 0 },
    );
    // Redirected to login or refused — never a 200 with a signed URL.
    expect(res.status()).not.toBe(200);
  });

  test("robots.txt disallows all crawlers", async ({ page }) => {
    const res = await page.request.get("/robots.txt");
    expect(res.ok()).toBeTruthy();
    expect(await res.text()).toMatch(/Disallow:\s*\//);
  });

  test("a disallowed sign-in is rejected", async ({ page }) => {
    test.skip(!hasCredentials, "requires E2E credentials");
    await page.goto("/login");
    await page.getByLabel("Email").fill("not-allowed@example.com");
    await page.getByLabel("Password").fill("whatever");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
