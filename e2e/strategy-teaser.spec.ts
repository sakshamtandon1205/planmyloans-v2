import { expect, test } from "@playwright/test";

test.describe("Strategy teaser grid", () => {
  test("hidden until 'See 4 strategies' is clicked, then reveals the form + 4 cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("strategy-teaser-bonus")).not.toBeAttached();

    await page.getByRole("button", { name: "See 4 strategies" }).click();

    await expect(page.getByText("We'll reuse the interest rate and tenure from Quick Estimate above")).toBeVisible();
    for (const id of ["aggressive", "balanced", "safety", "bonus"]) {
      await expect(page.getByTestId(`strategy-teaser-${id}`)).toBeVisible();
    }
    await expect(page.locator("#strategies")).toBeInViewport();
  });

  test("clicking a strategy card computes and applies it into the real Planner inputs", async ({ page }) => {
    await page.goto("/");
    const plannerDp = page.getByRole("spinbutton", { name: "Down payment (exact value)" });
    const dpBefore = await plannerDp.inputValue();

    await page.getByRole("button", { name: "See 4 strategies" }).click();
    await page.getByTestId("strategy-teaser-bonus").click();

    await expect(plannerDp).not.toHaveValue(dpBefore);
    await expect(page.locator("#planner")).toBeInViewport();
  });
});
