import { expect, test } from '@playwright/test'
import { hasInboxCreds, waitForVerificationPin } from './helpers/ethereal'
import {
  fillOtp,
  loginViaUi,
  logoutViaUi,
  registerViaUi,
  submitLogin,
  verifyEmailViaUi,
} from './helpers/auth'

/**
 * The full authentication journey, driven end to end through the app UI against
 * a live API:
 *
 *   register -> verify email -> logout -> login -> forgot password ->
 *   reset password -> login with the new password -> old password rejected.
 *
 * MFA is intentionally out of scope: enabling it needs a TOTP computed from a
 * secret the UI never exposes (only a QR code), so it can't be driven purely
 * through the browser.
 *
 * Needs the backend stack up and a test inbox (E2E_IMAP_*); skips otherwise.
 */

test.describe('full auth flow', () => {
  test.skip(!hasInboxCreds(), 'E2E_IMAP_USER / E2E_IMAP_PASS not set — see tests/e2e/README.md')

  // One user threads through every step, so run the steps in order.
  test.describe.configure({ mode: 'serial' })

  test('register, verify, logout, login, reset password, re-login', async ({ page }) => {
    // Long journey: two email round-trips (IMAP polling) plus several logins.
    test.setTimeout(180_000)
    const email = `auth-${Date.now()}@crewfinding.test`
    const password = 'TestPassw0rd!2026'
    const newPassword = 'FreshPassw0rd!2026'

    await test.step('register a new account', async () => {
      await registerViaUi(page, { email, password })
    })

    await test.step('verify email with the mailed code', async () => {
      const { code } = await waitForVerificationPin(email, { subjectIncludes: 'Confirm your account' })
      await verifyEmailViaUi(page, code)
    })

    await test.step('log out from the account menu', async () => {
      await logoutViaUi(page)
    })

    await test.step('log back in with the original password', async () => {
      await loginViaUi(page, { email, password })
    })

    await test.step('request a password reset', async () => {
      await logoutViaUi(page)
      await page.goto('/forgot-password')
      await page.fill('#email', email)
      await page.click('button[type="submit"]')
      // The confirmation view links onward to the reset screen.
      await expect(page.getByText('Check your inbox')).toBeVisible({ timeout: 15_000 })
    })

    await test.step('reset the password with the mailed code', async () => {
      const { code } = await waitForVerificationPin(email, { subjectIncludes: 'Reset your password' })
      await page.goto('/reset-password')
      await fillOtp(page, code)
      await page.fill('#password', newPassword)
      await page.fill('#confirmPassword', newPassword)
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    })

    await test.step('the new password works', async () => {
      await loginViaUi(page, { email, password: newPassword })
    })

    await test.step('the old password is rejected', async () => {
      await logoutViaUi(page)
      await submitLogin(page, { email, password })
      // Stay on /login with the inline "Invalid credentials" error on the
      // password field rather than reaching the dashboard.
      await expect(page).toHaveURL(/\/login/)
      await expect(page.locator('#password-message')).toHaveText(/invalid credentials/i, {
        timeout: 10_000,
      })
    })
  })
})
