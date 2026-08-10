import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import type { Result } from "axe-core";

const FAIL_ON_IMPACTS = new Set(["serious", "critical"]);

async function runAxeScan(page: Page, name: string) {
  const results = await new AxeBuilder({ page }).analyze();

  const failing: Result[] = [];
  const reportable: Result[] = [];
  for (const violation of results.violations) {
    (FAIL_ON_IMPACTS.has(violation.impact ?? "") ? failing : reportable).push(violation);
  }

  if (reportable.length > 0) {
     
    console.log(
      `\n[a11y] ${name}: ${reportable.length} moderate/minor violation(s) (not failing the test):\n` +
        reportable
          .map(
            (v) =>
              `  - [${v.impact}] ${v.id}: ${v.description}\n` +
              v.nodes.map((n) => `      target: ${n.target.join(" ")}\n      ${n.failureSummary}`).join("\n"),
          )
          .join("\n"),
    );
  }

  if (failing.length > 0) {
    const details = failing
      .map(
        (v) =>
          `[${v.impact}] ${v.id}: ${v.description}\n  help: ${v.helpUrl}\n  nodes:\n` +
          v.nodes.map((n) => `    - ${n.target.join(" ")}\n      ${n.failureSummary}`).join("\n"),
      )
      .join("\n\n");
    throw new Error(`[a11y] ${name}: ${failing.length} serious/critical violation(s):\n\n${details}`);
  }
}

/**
 * The homepage's hero/result cards stagger-fade in via Framer Motion (each
 * card, and each value within a card, animates on its own timer), so axe
 * must wait for every one of them to settle first — scanning mid-fade
 * measures a transient blended color, not the actual design tokens.
 */
async function waitForHomepageSettled(page: Page) {
  await expect(page.getByTestId("result-emi")).toHaveCSS("opacity", "1");
  await page.waitForFunction(() => {
    const animated = document.querySelectorAll<HTMLElement>('[style*="opacity"]');
    for (const el of animated) {
      const opacity = getComputedStyle(el).opacity;
      if (opacity !== "" && Number(opacity) < 1) return false;
    }
    return true;
  });
}

test.describe("Accessibility (axe)", () => {
  test("homepage - light mode", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await waitForHomepageSettled(page);
    await runAxeScan(page, "homepage (light mode)");
  });

  test("homepage - dark mode", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("button", { name: "Toggle dark mode" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await waitForHomepageSettled(page);
    await runAxeScan(page, "homepage (dark mode)");
  });

  test("guides hub", async ({ page }) => {
    await page.goto("/guides");
    await runAxeScan(page, "/guides");
  });

  test("guide article", async ({ page }) => {
    await page.goto("/guides/emi-calculation-explained");
    await runAxeScan(page, "/guides/emi-calculation-explained");
  });

  test("about page", async ({ page }) => {
    await page.goto("/about");
    await runAxeScan(page, "/about");
  });

  test("contact page", async ({ page }) => {
    await page.goto("/contact");
    await runAxeScan(page, "/contact");
  });

  test("privacy page", async ({ page }) => {
    await page.goto("/privacy");
    await runAxeScan(page, "/privacy");
  });
});
