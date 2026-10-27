import { expect, test, type Page } from "@playwright/test"

const LESSON = "/lessons/a1/05-be-am-is-are"

/** Islands render on the server first; wait until React has hydrated them. */
async function hydrated(page: Page) {
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0, { timeout: 30_000 })
}

/** client:visible islands hydrate only when scrolled into view. */
async function addCards(page: Page) {
  await page.goto(LESSON)
  const add = page.getByRole("button", { name: "Add to my flashcards" })
  await add.scrollIntoViewIfNeeded()
  await expect(add).toBeEnabled()
  await add.click()
  await expect(page.getByRole("button", { name: "In your flashcards" })).toBeVisible()
}

test("home links into the course", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Learn all of English grammar")
  await page.getByRole("link", { name: "See the whole roadmap" }).click()
  await expect(page).toHaveURL(/\/roadmap/)
  await expect(page.getByRole("heading", { name: "The roadmap" })).toBeVisible()
})

test("exercises give instant feedback", async ({ page }) => {
  await page.goto(LESSON)
  const practice = page.getByRole("region", { name: "Practice" })
  await practice.scrollIntoViewIfNeeded()
  // Clicks before hydration are lost, so wait until the practice island is interactive.
  await expect(practice.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", { timeout: 30_000 })

  // 1 · multiple choice, correct answer ("is")
  const first = practice.locator("ol > li").nth(0)
  await first.getByText("is", { exact: true }).click()
  await first.getByRole("button", { name: "Check" }).click()
  await expect(first.getByText("Correct!")).toBeVisible()

  // 3 · gap fill, wrong answer
  const third = practice.locator("ol > li").nth(2)
  await third.getByRole("textbox").fill("is")
  await third.getByRole("button", { name: "Check" }).click()
  await expect(third.getByText("Not quite.")).toBeVisible()
  await expect(third.getByText("Answer:")).toBeVisible()

  // Try again resets the item
  await third.getByRole("button", { name: "Try again" }).click()
  await third.getByRole("textbox").fill("am")
  await third.getByRole("button", { name: "Check" }).click()
  await expect(third.getByText("Correct!")).toBeVisible()
})

test("match exercises use labelled dropdowns", async ({ page }) => {
  await page.goto("/lessons/a1/01-parts-of-speech")
  const practice = page.getByRole("region", { name: "Practice" })
  await practice.scrollIntoViewIfNeeded()
  const match = practice.locator("ol > li").filter({ hasText: "Match each word with its part of speech." })
  await match.scrollIntoViewIfNeeded()
  await expect(match.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", { timeout: 30_000 })

  for (const [word, job] of [["Tehran", "noun"], ["she", "pronoun"], ["and", "conjunction"], ["in", "preposition"], ["the", "determiner"]]) {
    await match.getByLabel(word, { exact: true }).click()
    await page.getByRole("option", { name: job, exact: true }).click()
    await expect(match.getByLabel(word, { exact: true })).toHaveText(job)
  }
  await match.getByRole("button", { name: "Check" }).click()
  await expect(match.getByText("Correct!")).toBeVisible()
})

test("flashcards: add from a lesson, review, and the due date moves", async ({ page }) => {
  await addCards(page)

  await page.goto("/flashcards")
  await hydrated(page)
  await expect(page.getByText("5 left")).toBeVisible()
  await page.getByRole("button", { name: /Show answer/ }).click()
  await page.getByRole("button", { name: /^Good/ }).click()
  // A new card rated Good comes back within minutes, so it stays in today's queue at the back.
  await expect(page.getByText(/[45] left/)).toBeVisible()

  const due = await page.evaluate(async () => {
    const req = indexedDB.open("english-grammar-mastery")
    const db: IDBDatabase = await new Promise((res) => (req.onsuccess = () => res(req.result)))
    const rows: { due: number; addedAt: number; card: { reps: number } }[] = await new Promise((res) => {
      const r = db.transaction("cards").objectStore("cards").getAll()
      r.onsuccess = () => res(r.result)
    })
    return rows.filter((r) => r.card.reps > 0).map((r) => r.due - r.addedAt)
  })
  expect(due.length).toBe(1)
  expect(due[0]).toBeGreaterThan(0)
})

test("backup export → import round-trip restores flashcards", async ({ page }) => {
  await addCards(page)

  await page.goto("/settings")
  await hydrated(page)
  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Download backup" }).click()
  const download = await downloadPromise
  const path = await download.path()

  await page.getByRole("button", { name: "Delete all flashcards" }).click()
  await page.getByRole("button", { name: "Delete", exact: true }).click()
  await page.goto(LESSON)
  await page.getByRole("button", { name: "Add to my flashcards" }).scrollIntoViewIfNeeded()
  await expect(page.getByRole("button", { name: "Add to my flashcards" })).toBeEnabled()

  await page.goto("/settings")
  await hydrated(page)
  await page.getByLabel("Backup file").setInputFiles(path!)
  await expect(page.getByText("5 flashcards imported.")).toBeVisible()
  await page.goto(LESSON)
  await page.getByText("Keep it: flashcards").scrollIntoViewIfNeeded()
  await expect(page.getByRole("button", { name: "In your flashcards" })).toBeVisible()
})

test("theme and font size persist after reload", async ({ page }) => {
  await page.goto("/settings")
  await hydrated(page)
  await page.getByRole("button", { name: "Night" }).click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night")
  await page.reload()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "night")
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.getByRole("button", { name: "Sepia" }).click()
  await page.goto("/")
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sepia")
})

test("Persian mode Off hides Persian help", async ({ page }) => {
  await page.goto(LESSON)
  const persian = page.locator(".persian-block").first()
  await expect(persian).toBeVisible()
  await page.goto("/settings")
  await hydrated(page)
  await page.getByText("Off", { exact: true }).click()
  await page.goto(LESSON)
  await expect(page.locator("html")).toHaveAttribute("data-persian", "never")
  await expect(page.locator(".persian-block").first()).toBeHidden()
})

test("mindmap Recall mode folds and reveals branches", async ({ page }) => {
  await page.goto("/mindmaps/master")
  const svg = page.locator("svg.markmap")
  await expect(svg.locator("foreignObject").first()).toBeVisible()
  // Recall mode starts folded: the four families are visible, their pillars are not.
  await expect(svg.getByText("Words", { exact: true })).toBeVisible()
  await expect(svg.getByText("2 Nouns")).toHaveCount(0)
  await page.getByRole("button", { name: "Open all branches" }).click()
  await expect(svg.getByText("2 Nouns")).toBeVisible()
})

test("grammar index links resolve to lessons", async ({ page }) => {
  await page.goto("/grammar-index")
  const link = page.getByRole("link", { name: "be: am / is / are" })
  await link.click()
  await expect(page).toHaveURL(new RegExp(LESSON))
})

test("search palette finds a lesson", async ({ page }) => {
  await page.goto("/")
  await hydrated(page)
  const input = page.getByPlaceholder(/Try/)
  // Effects (the key listener) attach a moment after hydration: retry the shortcut until the palette opens.
  await expect(async () => {
    if (!(await input.isVisible())) await page.keyboard.press("Control+k")
    await expect(input).toBeVisible({ timeout: 2_000 })
  }).toPass({ timeout: 15_000 })
  await input.fill("am is are")
  await page.getByRole("option", { name: /be: am, is, are/ }).first().click()
  await expect(page).toHaveURL(new RegExp(LESSON))
})
