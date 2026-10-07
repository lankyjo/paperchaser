import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

test('a project exports to a file that re-imports as a copy, and a newer-version file is refused', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Project title').fill('Acme rebrand')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.goto('/')
  await page.getByRole('link', { name: 'Acme rebrand' }).click()

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export project' }).click()
  const file = await (await download).path()
  const json = readFileSync(file, 'utf8')

  await page.goto('/settings')
  await page.getByLabel('Import file').setInputFiles({ name: 'acme.json', mimeType: 'application/json', buffer: Buffer.from(json) })
  await page.getByRole('button', { name: 'Import as copy' }).click()
  await expect(page.getByRole('status')).toHaveText('Project imported.')
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Acme rebrand' })).toHaveCount(2)

  await page.goto('/settings')
  const newer = JSON.stringify({ ...JSON.parse(json), version: 99 })
  await page.getByLabel('Import file').setInputFiles({ name: 'future.json', mimeType: 'application/json', buffer: Buffer.from(newer) })
  await expect(page.getByRole('status')).toHaveText('This file was made by a newer version of Paperchaser.')
})

test('restoring a workspace backup downloads the current data first, then replaces it', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Project title').fill('Keep me')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.goto('/settings')
  const backupDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download backup' }).click()
  const backup = readFileSync(await (await backupDownload).path(), 'utf8')

  await page.goto('/')
  await page.getByLabel('Project title').fill('Added later')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.goto('/settings')
  await page.getByLabel('Import file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(backup) })
  const safety = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Restore backup' }).click()
  await safety
  await expect(page.getByRole('status')).toContainText('Workspace restored')
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Keep me' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Added later' })).toHaveCount(0)
})

test('home reminds to back up until a backup is downloaded, and settings shows when that was', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Project title').fill('Reminder test')
  await page.getByRole('button', { name: 'New project' }).click()
  await page.goto('/')
  const reminder = page.getByRole('region', { name: 'Backup reminder' })
  await expect(reminder).toContainText('You have not downloaded a backup yet.')
  const download = page.waitForEvent('download')
  await reminder.getByRole('button', { name: 'Download backup' }).click()
  await download
  await expect(reminder).toHaveCount(0)
  await page.goto('/settings')
  await expect(page.getByText(/^Last backup: /)).toBeVisible()
})
