import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Several full-page axe scans per test, so allow more than the default 30s.
test.describe.configure({ timeout: 90_000 })

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function expectNoViolations(page: Page, label: string) {
  // The DRAFT/PAID watermark is decorative, aria-hidden text, which contrast rules exempt.
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).exclude('.watermark').analyze()
  const summary = violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join(', ')}`)
  expect(summary, label).toEqual([])
}

test('home, project, editor and settings have no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/app')
  await expect(page.getByRole('region', { name: 'Set up your business' })).toBeVisible()
  await expectNoViolations(page, 'first-run home')

  const setup = page.getByRole('region', { name: 'Set up your business' })
  await setup.getByLabel('Business name').fill('Northwind Studio')
  await setup.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Sample: Acme coffee rebrand' })).toBeVisible()
  await expectNoViolations(page, 'home')

  await page.getByRole('link', { name: 'Sample: Acme coffee rebrand' }).click()
  await expect(page.getByRole('heading', { name: 'Sample: Acme coffee rebrand' })).toBeVisible()
  await expectNoViolations(page, 'project')

  await page.getByRole('listitem', { name: 'Invoice' }).getByRole('link').first().click()
  await expect(page.locator('#document-root')).toBeVisible()
  await expectNoViolations(page, 'editor')

  await page.goto('/settings')
  await expect(page.getByRole('region', { name: 'Company profile' })).toBeVisible()
  await expectNoViolations(page, 'settings')
})

test('the mobile editor has no WCAG 2.2 AA violations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => localStorage.setItem('paperchaser.welcomeSkipped', '1'))
  await page.goto('/app')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.getByRole('dialog', { name: 'About the Invoice' }).getByRole('button', { name: 'Got it' }).click()
  await expect(page.locator('#document-root')).toBeVisible()
  await expectNoViolations(page, 'mobile editor')
})
