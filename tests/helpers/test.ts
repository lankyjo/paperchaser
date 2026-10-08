import { test as base } from '@playwright/test'

// Starts every test past the first-run welcome; specs that test the welcome import @playwright/test directly.
export const test = base.extend({
  context: async ({ context }, provide) => {
    await context.addInitScript(() => localStorage.setItem('paperchaser.welcomeSkipped', '1'))
    await provide(context)
  },
})

export { expect, type Page } from '@playwright/test'
