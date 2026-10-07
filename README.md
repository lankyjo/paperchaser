# Paperchaser

Paperchaser is a free app for freelancers. You use it to make the documents of one client job, from the first quote to the last feedback form. The app runs in your browser and works offline. Your data stays on your device.

## What you can make

Each client job is a project. A project has ten steps. Each step has a short guide for people who are new to freelance work.

| Step | Document |
|---|---|
| 1 | Quote (optional) |
| 2 | Client agreement, with a payment schedule and signatures |
| 3 | Welcome document |
| 4 | Project brief |
| 5 | Invoice, and a credit note to correct a paid invoice |
| 6 | Delivery guide |
| 7 | Monthly report |
| 8 | Receipt |
| 9 | Thank-you note |
| 10 | Feedback form |

The app also makes payment reminders for invoices that are late.

## Main features

- Seven templates: Blank, Minimal, Noir Ledger, Atelier, Statement, Swiss and Correspondence.
- Your colors, fonts and logo on every document.
- A PDF from the print dialog of your browser. The preview shows the same page breaks as the PDF.
- A number for each document when you finalize it. A sent document cannot change.
- Payments, receipts, credit notes and a list of late invoices.
- Backups and imports as JSON files.
- Optional AI suggestions. You can connect OpenRouter or a model that runs on your computer.

## Where your data is

The app keeps all data in IndexedDB in your browser. Images are in the same database. The app does not send your data to a server.

Each browser and each device has its own data. To move your work to a different device, download a backup and import it on that device.

CAUTION: Download a backup often. If you clear the data of your browser, your projects are deleted. Safari deletes the data of a website after seven days without a visit. To prevent this, add Paperchaser to your Home Screen or Dock.

## Run the app

You need Node.js 24 (the version that CI uses) and pnpm.

1. Install the dependencies:

   ```sh
   pnpm install
   ```

2. Start the development server:

   ```sh
   pnpm dev
   ```

3. Open the address that the command shows.

To make a production build, use this command:

```sh
pnpm build
```

The build goes into `dist/`. You can serve `dist/` from any static host. The app installs as a progressive web app and then works offline.

## AI suggestions

AI is optional. The app works without it.

1. Open **Settings**.
2. In the AI section, select OpenRouter or a local model.
3. If you select OpenRouter, sign in or paste an API key.
4. If you select a local model, give its address. The default is `http://localhost:11434/v1`.

The AI suggests a set of edits to a draft document. You accept or discard the full set. The AI cannot change a sent document. The app keeps the API key on your device. Backups do not contain the key.

## Edit your data with an agent

You can give your data to a coding agent, for example Claude Code or Codex. Download a backup, let the agent edit the JSON file, and import the file again. Read [docs/agents/workspace-json.md](docs/agents/workspace-json.md) for the file format and the rules that an agent must obey.

## Tests

| Command | What it does |
|---|---|
| `pnpm test:unit` | Runs the unit tests (Vitest). |
| `pnpm test` | Runs the browser tests (Playwright). Run `pnpm build` first, because the tests use the production build. |
| `pnpm check:conventions` | Runs the linter and the checks for comments, file names and effects. |
| `pnpm typecheck` | Runs the TypeScript compiler. |
| `pnpm test:update` | Writes new reference images for the print tests. Use it only after a template change that you want. |

The browser tests compare each printed page with the PDF of Chromium. They also check accessibility with axe and do a full task with only the keyboard. Read [docs/accessibility.md](docs/accessibility.md) for the details.

## Code rules

Read [AGENTS.md](AGENTS.md) before you change the code. The main rules:

- A comment is one line. It tells what the code does, not why a decision was made.
- Each folder holds only what its name says.
- Logic that has state goes in a custom hook. A component does not call `useEffect` directly.
- Each file has the name of its main export.

CI runs these checks on each push.

## Project structure

| Folder | Contents |
|---|---|
| `src/document/` | The document model, totals, money, pagination and templates. No React. |
| `src/project/` | Projects, clients, the pipeline and backups. No React. |
| `src/db/` | Storage in IndexedDB (Dexie). |
| `src/components/` | React components, in one folder for each feature. |
| `src/hooks/` | Hooks that more than one feature uses. |
| `src/ai/` | The optional AI client and the safe application of AI edits. |
| `src/strings/` | All text that a user sees, in one place. |
| `src/routes/` | The pages of the app. |
| `docs/adr/` | Records of the main design decisions. |

## License

No license file is in this repository yet. Until the owner adds one, all rights are reserved.
