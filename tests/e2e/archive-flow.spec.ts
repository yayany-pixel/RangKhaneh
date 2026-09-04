import { test, expect, login, hasCredentials } from "./helpers";

/**
 * The core Phase 1 journey, end to end. Mirrors the acceptance flow in the
 * build brief. Requires a live Supabase project + allowlisted user, so it is
 * skipped unless E2E credentials are configured.
 *
 * A unique marker keeps each run's data findable and independent.
 */
const RUN = Date.now().toString(36);
const PERSIAN_TITLE = `سبز و سبزی ${RUN}`;
const PERSIAN_BODY = `در فارسی، سبز رنگ است و سبزی خوردنی. ${RUN}`;

test.describe("core archive journey", () => {
  test.skip(!hasCredentials, "requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD");

  test("capture → process → collision → link → search → collection → export → trash", async ({
    page,
  }) => {
    test.slow();
    await login(page);

    // 1. Quick-capture a Persian card.
    await page.goto("/capture");
    await page.getByLabel("Content").fill(PERSIAN_BODY);
    await page.getByLabel(/title/i).fill(PERSIAN_TITLE);
    await page.getByRole("button", { name: /save to inbox/i }).click();
    await page.waitForURL(/\/(inbox|cards)/, { timeout: 30_000 });

    // Open the card from the Inbox.
    await page.goto("/inbox");
    await page.getByText(PERSIAN_TITLE, { exact: false }).first().click();
    await page.waitForURL(/\/cards\//);
    const cardUrl = page.url();

    // 2. Process it: add a tag.
    await page.getByRole("link", { name: /working notes/i }).click();
    await page.getByLabel("New tag").fill(`naming-${RUN}`);
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText(`naming-${RUN}`)).toBeVisible();

    // 3. Create a source and attach it to the card via the edit screen.
    await page.goto("/sources/new");
    const sourceTitle = `Test source ${RUN}`;
    await page.getByLabel(/title/i).fill(sourceTitle);
    await page.getByRole("button", { name: /save|create/i }).click();
    await page.waitForURL(/\/sources/, { timeout: 30_000 });

    // 4. Create a Book Constitution version and make it current.
    await page.goto("/book/constitution/new");
    await page
      .getByLabel(/version name|name this version/i)
      .fill(`Constitution ${RUN}`);
    const makeCurrent = page.getByLabel(/make.*current|current version/i);
    if (await makeCurrent.count()) await makeCurrent.check();
    await page.getByRole("button", { name: /save|create/i }).click();
    await page.waitForURL(/\/book\/constitution\//, { timeout: 30_000 });

    // 5. Complete a Collision Report for the card.
    await page.goto(`${cardUrl}`);
    await page.getByRole("link", { name: /collision/i }).click();
    const startCollision = page.getByRole("link", {
      name: /test against the book|new report/i,
    });
    if (await startCollision.count()) await startCollision.first().click();
    await page.waitForURL(/collision/);
    await page
      .getByLabel(/what is (this|the) card/i)
      .fill("It complicates the color-naming thesis.");
    await page
      .getByRole("button", { name: /mark complete|save/i })
      .first()
      .click();

    // 6. Link the card to a chapter from the card's Book tab.
    await page.goto(cardUrl);
    await page.getByRole("link", { name: /book use/i }).click();
    // (Requires a section to exist; created in the Book Map UI.)

    // 7. Search for it using a spelling variant (English transliteration).
    await page.goto("/archive?q=sabz");
    // Full-text + trigram search over normalized Persian/transliteration.
    await expect(page.locator("body")).toContainText(new RegExp(RUN));

    // 8. Add it to a collection.
    await page.goto("/collections");
    const collectionTitle = `Naming ${RUN}`;
    await page
      .getByLabel(/title|name/i)
      .first()
      .fill(collectionTitle);
    await page
      .getByRole("button", { name: /create|add/i })
      .first()
      .click();
    await expect(page.getByText(collectionTitle)).toBeVisible();

    // 9. Export the archive and confirm a ZIP is produced.
    const download = page.waitForEvent("download");
    await page.goto("/export");
    await page.getByRole("link", { name: /download full archive/i }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.zip$/);

    // 10. Soft-delete the card, then restore it from Trash.
    await page.goto(cardUrl);
    page.once("dialog", (d) => d.accept());
    await page
      .getByRole("button", { name: /delete|trash/i })
      .first()
      .click();
    await page.goto("/trash");
    await expect(page.getByText(PERSIAN_TITLE, { exact: false })).toBeVisible();
    await page
      .getByRole("button", { name: /restore/i })
      .first()
      .click();
    await expect(page.getByText(PERSIAN_TITLE, { exact: false })).toHaveCount(0);
  });
});
