import { expect, test } from "@playwright/test";

test.describe("Keyboard navigation", () => {
  test("funding mode toggle is operable via keyboard alone", async ({ page }) => {
    await page.goto("/");

    const bankButton = page.getByRole("button", { name: "Bank account" });
    await bankButton.focus();
    await expect(bankButton).toBeFocused();
    await expect(bankButton).toHaveAttribute("aria-pressed", "false");

    await page.keyboard.press("Enter");
    await expect(bankButton).toHaveAttribute("aria-pressed", "true");

    const corpusField = page.getByText("Set automatically: own funds").locator("..");
    await expect(corpusField).toContainText("Bank account");
    await expect(page.getByRole("slider", { name: "Bank interest rate" })).toBeVisible();
  });

  test("collapsible sections (native <details>/<summary>) expand via keyboard", async ({ page }) => {
    await page.goto("/");

    // "Tax assumptions" is collapsed by default.
    await expect(page.getByRole("slider", { name: "Marginal income tax rate" })).toBeHidden();

    const summary = page.getByText("Tax assumptions");
    await summary.focus();
    await expect(summary).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.getByRole("slider", { name: "Marginal income tax rate" })).toBeVisible();

    // Space should toggle it closed again, same as any native disclosure widget.
    await page.keyboard.press("Space");
    await expect(page.getByRole("slider", { name: "Marginal income tax rate" })).toBeHidden();
  });

  test("theme toggle is operable via keyboard alone", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Toggle dark mode" });
    await toggle.focus();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("tabbing through the control panel reaches every field with a visible focus indicator", async ({
    page,
  }) => {
    await page.goto("/");

    const priceSlider = page.getByRole("slider", { name: "Property price" });
    const priceNumber = page.getByRole("spinbutton", { name: "Property price (exact value)" });

    // Real Tab presses (not .focus()) so :focus-visible reliably engages,
    // matching how a keyboard-only user actually reaches these controls.
    await priceSlider.focus();
    await expect(priceSlider).toBeFocused();
    const priceSliderOutline = await priceSlider.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(priceSliderOutline).not.toBe("none");

    await page.keyboard.press("Tab");
    await expect(priceNumber).toBeFocused();
    const priceNumberOutline = await priceNumber.evaluate((el) => {
      const cs = getComputedStyle(el);
      return cs.outlineStyle !== "none" ? cs.outlineStyle : cs.boxShadow;
    });
    expect(priceNumberOutline).not.toBe("none");

    // WebKit's default keyboard-access setting only tabs to text-like fields,
    // skipping <input type="range"> entirely (a Safari platform default, not
    // something a web page can override) — Chromium/Firefox tab to the range
    // slider next, WebKit goes straight to its paired number input. Either
    // way the "Own funds available" field must be reachable next.
    await page.keyboard.press("Tab");
    const focusedLabel = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    expect(["Own funds available", "Own funds available (exact value)"]).toContain(focusedLabel);
  });

  test("reset button is reachable and operable via keyboard", async ({ page }) => {
    await page.goto("/");
    const resetButton = page.getByRole("button", { name: "Reset" });
    await resetButton.focus();
    await expect(resetButton).toBeFocused();

    const outlineStyle = await resetButton.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).not.toBe("none");
  });
});
