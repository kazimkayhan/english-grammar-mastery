// Every built page, at phone width: no sideways scrolling, no console errors,
// no serious or critical accessibility violations (WCAG 2.1 AA, via axe).
import { readdirSync, statSync } from "node:fs"
import { join, sep } from "node:path"
import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]))

const routes = walk("dist")
  .filter((p) => p.endsWith(`${sep}index.html`))
  .map((p) => "/" + p.split(sep).slice(1, -1).join("/"))
  .sort()

test.use({ viewport: { width: 375, height: 812 } })

for (const route of routes) {
  test(`quality: ${route}`, async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (e) => errors.push(e.message))
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text())
    })

    await page.goto(route, { waitUntil: "networkidle" })

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, "page scrolls sideways on a phone").toBeLessThanOrEqual(1)

    expect(errors, "console errors").toEqual([])

    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
    const serious = violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)
    expect(serious, "accessibility violations").toEqual([])
  })
}
