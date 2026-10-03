# End-to-end tests

Playwright specs that drive the app in a real browser against a running backend.

## Prerequisites

- **API + database up.** The app talks to the api on `http://localhost:3000`
  (see the repo root for how to start the api, its Postgres, and the SSH tunnel).
- **A test inbox** for the email-dependent specs. The api sends transactional
  mail over SMTP; the tests read the code back over IMAP. We use
  [Ethereal](https://ethereal.email) (a capture-only mailbox) in dev.

## Configure

The inbox credentials are read from the environment — nothing secret is
committed. Copy the example and fill it in, then export it before running:

```sh
cp tests/e2e/.env.e2e.example tests/e2e/.env.e2e
# edit tests/e2e/.env.e2e, then:
set -a && . tests/e2e/.env.e2e && set +a
```

| Variable        | Default              | Purpose                          |
| --------------- | -------------------- | -------------------------------- |
| `E2E_BASE_URL`  | `http://localhost:5173` | App URL under test            |
| `E2E_IMAP_HOST` | `imap.ethereal.email`   | Test-inbox IMAP host          |
| `E2E_IMAP_PORT` | `993`                   | IMAP port (implicit TLS)      |
| `E2E_IMAP_USER` | —                       | Inbox login (required)        |
| `E2E_IMAP_PASS` | —                       | Inbox password (required)     |

Specs that need the inbox **skip themselves** when `E2E_IMAP_USER` /
`E2E_IMAP_PASS` are unset, so the suite stays green where email is unreachable.

## Run

```sh
npm run test:e2e         # headless
npm run test:e2e:ui      # Playwright UI mode
```

The config starts the app dev server automatically (or reuses one already
running on `E2E_BASE_URL`).

## Intel macOS: use the system Chrome

`npx playwright install chromium` fails there with *"Playwright does not support
chromium on mac12"*, which makes the whole suite look unrunnable. It is not —
the system Chrome works. `playwright.config.ts` points at
`/Applications/Google Chrome.app` automatically when it exists, so
`npm run test:e2e` just works; set `E2E_CHROME_PATH` to use a different binary.

## Asserting on a React app

Two things bit real runs here, both of them the harness sampling too early
rather than the app being wrong:

- **`networkidle` fires before React commits the re-render.** A `count()`
  immediately after `goto` can see zero buttons that are about to exist. Use
  `expect(locator).toBeVisible()` or `waitFor()`, which retry — Playwright's
  `click()` already auto-waits, which is why a click can succeed while a
  `count()` taken a line earlier says zero.
- **Work can be queued behind other requests.** The OAuth code exchange fires
  after the session probe, so a fixed `waitForTimeout(1500)` misses it. Wait for
  the *outcome* (the text, the request), never for a duration.
