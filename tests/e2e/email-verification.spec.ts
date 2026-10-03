import { expect, test } from '@playwright/test'
import { hasInboxCreds, waitForVerificationPin } from './helpers/ethereal'
import { registerViaUi, verifyEmailViaUi } from './helpers/auth'

/**
 * Email verification on its own, exercised through the app UI:
 *
 *   register form  ->  API sends the code over SMTP  ->  read it from the inbox
 *   ->  enter it on /verify  ->  app confirms and redirects to the dashboard.
 *
 * The broader journey (logout, login, password reset) lives in auth-flow.spec.ts.
 * Requires the backend stack running and a test inbox (E2E_IMAP_*); skips
 * cleanly when the inbox creds are absent — see tests/e2e/README.md.
 */

const PASSWORD = 'TestPassw0rd!2026'

test.describe('email verification', () => {
  test.skip(!hasInboxCreds(), 'E2E_IMAP_USER / E2E_IMAP_PASS not set — see tests/e2e/README.md')

  test('a new user can register and verify their email through the UI', async ({ page }) => {
    const email = `e2e-${Date.now()}@crewfinding.test`

    await registerViaUi(page, { email, password: PASSWORD })

    const { code } = await waitForVerificationPin(email, { subjectIncludes: 'Confirm your account' })
    expect(code).toMatch(/^\d{6}$/)

    await verifyEmailViaUi(page, code)
  })
})
