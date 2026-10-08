import { expect, test, type Page } from './helpers/test'

const reply = (operations: object[]) => JSON.stringify({ summary: 'Warmer heading', operations })

async function openWelcome(page: Page) {
  await page.goto('/app')
  await page.getByRole('button', { name: 'Quick invoice' }).click()
  await expect(page).toHaveURL(/\/(documents|projects)\//)
  await page.goto('/app')
  await page.getByRole('link', { name: 'Untitled project' }).click()
  await page.getByRole('button', { name: 'Start welcome' }).click()
}

test('a local model suggestion is reviewed, accepted, and can be undone; protected edits are refused', async ({ page }) => {
  await page.goto('/settings')
  await page.getByLabel('Provider').selectOption('local')
  await expect(page.getByLabel('Local server address')).toHaveValue('http://localhost:11434/v1')

  let operations: object[] = [{ op: 'replace', path: '/blocks/0/text', valueJson: '"Welcome aboard, Acme"' }]
  await page.route('http://localhost:11434/v1/chat/completions', (route) =>
    route.fulfill({ json: { choices: [{ message: { content: reply(operations) } }] } }),
  )
  await openWelcome(page)
  const ai = page.getByRole('region', { name: 'AI assistant' })
  await ai.getByLabel('Ask AI').fill('Make the heading warmer')
  await ai.getByRole('button', { name: 'Suggest' }).click()
  const suggestion = page.getByRole('region', { name: 'AI suggestion' })
  await expect(suggestion).toContainText('Heading: Welcome aboard, Acme')
  await suggestion.getByRole('button', { name: 'Accept' }).click()
  await expect(page.locator('#document-root').getByRole('heading', { name: 'Welcome aboard, Acme' })).toBeVisible()
  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(page.locator('#document-root').getByRole('heading', { name: 'Welcome to the team' })).toBeVisible()

  operations = [{ op: 'replace', path: '/status', valueJson: '"sent"' }]
  await ai.getByRole('button', { name: 'Suggest' }).click()
  await expect(ai.getByRole('alert')).toHaveText('The suggestion tried to change status, which AI may not edit.')
})

test('OpenRouter is called from the browser with the user key, the chosen model and a structured-output request', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByLabel('Model')).toHaveValue('anthropic/claude-opus-5.5')
  await page.getByLabel('API key').fill('sk-or-test')
  // The test navigates with full page loads, which forget session-only keys by design.
  await page.getByLabel('Remember on this device').check()
  await page.getByRole('button', { name: 'Save key' }).click()
  await expect(page.getByText('Key connected.')).toBeVisible()

  let captured: { auth: string; body: string } | null = null
  await page.route('https://openrouter.ai/api/v1/chat/completions', (route) => {
    captured = { auth: route.request().headers()['authorization'] ?? '', body: route.request().postData() ?? '' }
    return route.fulfill({
      json: {
        id: 'gen-1', object: 'chat.completion', created: 0, model: 'anthropic/claude-opus-5.5',
        choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: reply([{ op: 'replace', path: '/blocks/0/text', valueJson: '"Hello from OpenRouter"' }]) } }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      },
    })
  })
  await openWelcome(page)
  const ai = page.getByRole('region', { name: 'AI assistant' })
  await ai.getByLabel('Ask AI').fill('Say hello')
  await ai.getByRole('button', { name: 'Suggest' }).click()
  await expect(page.getByRole('region', { name: 'AI suggestion' })).toContainText('Hello from OpenRouter')

  const request = captured as unknown as { auth: string; body: string }
  expect(request.auth).toBe('Bearer sk-or-test')
  const body = JSON.parse(request.body)
  expect(body.model).toBe('anthropic/claude-opus-5.5')
  expect(JSON.stringify(body.response_format ?? {})).toContain('json')
})
