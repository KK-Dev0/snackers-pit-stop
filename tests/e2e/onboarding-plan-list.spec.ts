import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end happy path against the seeded local SQLite catalog. Each test gets
 * a fresh browser context, so Dexie starts empty just like a first-time user.
 */

async function goToStep(page: Page, step: number, heading: string) {
  // The first click can land before React hydrates on a cold dev server, so
  // retry until the progress indicator confirms the requested step.
  await expect(async () => {
    const current = await page.getByRole("progressbar").getAttribute("aria-label");
    if (current === `Step ${step} of 4`) {
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
      return;
    }
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByRole("progressbar", { name: `Step ${step} of 4` })).toBeVisible();
  }).toPass({ timeout: 15_000 });
}

test("onboarding → generate plan → shopping list", async ({ page }) => {
  // Selecting a store is also a crowdsourced vote; keep the shared seed pristine.
  await page.route("**/api/stores/confirm", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    }),
  );

  await page.goto("/onboarding");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "Diet", level: 1 })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Step 1 of 4" })).toBeVisible();

  const veg = page
    .getByRole("group", { name: "Diet type" })
    .getByRole("button", { name: "veg", exact: true });
  await veg.click();
  await expect(veg).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("spinbutton", { name: "Household servings" }).fill("2");
  await goToStep(page, 2, "Goals");

  await page.getByRole("spinbutton", { name: "Calorie goal (per day)" }).fill("2000");
  await page.getByRole("spinbutton", { name: "Weekly budget (INR)" }).fill("2000");
  await goToStep(page, 3, "Preferences");

  await goToStep(page, 4, "Location & stores");
  await page.getByRole("textbox", { name: "Pincode" }).fill("713301");

  const blinkit = page.getByRole("switch", { name: "Do you use Blinkit here?" });
  await expect(blinkit).toBeVisible();
  await blinkit.click();
  await expect(blinkit).toHaveAttribute("aria-checked", "true");

  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page).toHaveURL(/\/plan$/);
  await expect(page.getByRole("heading", { name: "Your week, sorted" })).toBeVisible();

  const generatedStatus = page
    .locator('p[role="status"]')
    .filter({ hasText: /Generated a plan for the week of/ });
  await expect(async () => {
    const button = page.getByRole("button", { name: "Generate plan", exact: true });
    if ((await button.count()) > 0) await button.click();
    await expect(generatedStatus).toBeVisible();
  }).toPass({ timeout: 15_000 });

  await expect(page.getByRole("group", { name: /slot$/ })).toHaveCount(28);
  await expect(
    page.getByRole("group", { name: "Mon breakfast slot" }).locator("p.truncate"),
  ).not.toBeEmpty();

  await page
    .getByRole("navigation", { name: "Primary" })
    .getByRole("link", { name: "List", exact: true })
    .click();

  await expect(page).toHaveURL(/\/list$/);
  await expect(page.getByRole("heading", { name: "Shopping list", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "List summary" })).toBeVisible();

  const items = page.getByRole("checkbox", { name: /^Check off / });
  await expect(items.first()).toBeVisible();
  expect(await items.count()).toBeGreaterThan(0);

  await items.first().click();
  await expect(page.getByRole("checkbox", { name: /^Uncheck / }).first()).toBeVisible();
});
