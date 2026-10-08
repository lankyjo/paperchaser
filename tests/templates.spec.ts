import { expect, test } from './helpers/test'
import { DOC_TYPE_IDS, DOC_TYPES } from '../src/document/docTypes'
import { TEMPLATE_REGISTRY } from '../src/document/tokens'

// Every document type renders and paginates in every template, with its title on page 1 and nothing cut off.
for (const template of Object.keys(TEMPLATE_REGISTRY)) {
  test(`${template} renders every document type`, async ({ page }) => {
    for (const type of DOC_TYPE_IDS) {
      await page.goto(`/?fixture=doc-${type}&template=${template}`)
      const first = page.locator('#print-root .document-page').first()
      await expect(first, `${template} ${type}`).toBeAttached()
      await expect(first, `${template} ${type} title`).toContainText(DOC_TYPES[type].title, { ignoreCase: true })
      await expect(page.getByRole('alert').filter({ hasText: 'taller than one page' }), `${template} ${type} fits`).toHaveCount(0)
    }
  })
}
