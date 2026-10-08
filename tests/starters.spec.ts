import { expect, test } from './helpers/test'

async function openProject(page: import('@playwright/test').Page) {
  await page.goto('/app')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await page.goto('/app')
  await page.getByRole('link', { name: 'Untitled project' }).click()
}

test('a new agreement starts with clauses, placeholders, a payment schedule, signatures and a not-legal-advice note', async ({ page }) => {
  await openProject(page)
  await page.getByRole('button', { name: 'Start client agreement' }).click()
  const pageRoot = page.locator('#document-root')
  await expect(pageRoot).toContainText('Revisions.')
  await expect(pageRoot.locator('.placeholder-node').first()).toBeVisible()
  await expect(pageRoot).toContainText('Payment schedule')
  await expect(pageRoot.getByText('Client signature', { exact: true })).toBeVisible()
  await expect(page.getByRole('note')).toContainText('not legal advice')
  await expect(pageRoot).not.toContainText('not legal advice')
})

test('a new project brief covers overview, objective, audience and key message', async ({ page }) => {
  await openProject(page)
  await page.getByRole('button', { name: 'Start project brief' }).click()
  const pageRoot = page.locator('#document-root')
  for (const section of ['Project overview', 'Objective', 'Target audience', 'Key message']) await expect(pageRoot).toContainText(section)
})

test('welcome, delivery guide and thank-you documents start with their sample content', async ({ page }) => {
  await openProject(page)
  await page.getByRole('button', { name: 'Start delivery guide' }).click()
  await expect(page.locator('#document-root')).toContainText('File name')
  await expect(page.locator('#document-root')).toContainText('Download link')
  await page.goBack()
  await page.getByRole('button', { name: 'Start thank you' }).click()
  await expect(page.locator('#document-root')).toContainText('Thank you for trusting us')
  await expect(page.locator('#document-root').getByText('Client signature', { exact: true })).toHaveCount(0)
  await page.goBack()
  await page.getByRole('button', { name: 'Start welcome' }).click()
  await expect(page.locator('#document-root')).toContainText('Discovery call')
})

test('monthly reports and feedback start with their sample content', async ({ page }) => {
  await openProject(page)
  await page.getByRole('button', { name: 'Start monthly report' }).click()
  const pageRoot = page.locator('#document-root')
  await expect(pageRoot).toContainText('Monthly Report — ')
  await expect(pageRoot.getByRole('img', { name: 'Bar chart' })).toBeVisible()
  await page.goBack()
  await page.getByRole('button', { name: 'Start feedback' }).click()
  await expect(pageRoot).toContainText('Value for money')
  await expect(pageRoot).toContainText('What could we have done better?')
})
