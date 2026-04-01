import { expect, test } from "../playwright-fixture";

test.describe("Chronicle smoke", () => {
  test("app shell loads and primary navigation is visible", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("CHRONICLE")).toBeVisible();
    await expect(page.getByRole("button", { name: /community gallery/i })).toBeVisible();
  });
});

