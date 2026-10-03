import { expect, type Page } from '@playwright/test'

/** Reusable UI actions for the auth screens, so specs read as a user journey. */

export interface Credentials {
  name?: string
  email: string
  password: string
}

/** Fill and submit the /register form; resolves once the app leaves /register. */
export async function registerViaUi(page: Page, creds: Credentials): Promise<void> {
  await page.goto('/register')
  await page.fill('#name', creds.name ?? 'Ella Twoee')
  await page.fill('#email', creds.email)
  await page.fill('#password', creds.password)
  await page.fill('#confirmPassword', creds.password)
  await page.check('#accept-terms')
  await page.click('button[type="submit"]')
  await expect(page).not.toHaveURL(/\/register/, { timeout: 15_000 })
}

/**
 * Type a code into the shared OtpInput. A full paste into the first box is
 * normally split across the boxes; fall back to one digit per box if not.
 */
export async function fillOtp(page: Page, code: string): Promise<void> {
  const boxes = page.locator('input[inputmode="numeric"]')
  await boxes.first().click()
  await boxes.first().fill(code)
  if ((await boxes.first().inputValue()).length <= 1) {
    for (let d = 0; d < code.length; d++) await boxes.nth(d).fill(code[d])
  }
}

/** Enter a verification code on /verify and expect success + dashboard redirect. */
export async function verifyEmailViaUi(page: Page, code: string): Promise<void> {
  await page.goto('/verify')
  await fillOtp(page, code)
  await page.click('button[type="submit"]')
  await expect(page.getByText('Email verified')).toBeVisible({ timeout: 15_000 })
  await expect(page).toHaveURL('/')
}

/**
 * What the navbar actually shows for the signed-in user.
 *
 * It renders `Account: {userDisplayName(user)}` — the person's NAME, falling
 * back to the local part of their email. Never the full address. Asserting on
 * `creds.email` therefore could not match, which is why this suite failed on
 * every run: the helper was written against an older navbar and nobody noticed
 * because the failure looked like a flaky timeout ("element(s) not found").
 *
 * Mirrors src/lib/session.tsx#userDisplayName deliberately — if that changes,
 * this is the one place to follow it.
 */
export function expectedAccountName(creds: Credentials): string {
  const name = (creds.name ?? 'Ella Twoee').trim()
  return name || creds.email.split('@')[0]!
}

/** Fill and submit the /login form. Does not assert the outcome. */
export async function submitLogin(page: Page, creds: Credentials): Promise<void> {
  await page.goto('/login')
  await page.fill('#email', creds.email)
  await page.fill('#password', creds.password)
  await page.click('button[type="submit"]')
}

/** Log in and expect to land on the dashboard as the given user. */
export async function loginViaUi(page: Page, creds: Credentials): Promise<void> {
  await submitLogin(page, creds)
  await expect(page).toHaveURL('/', { timeout: 15_000 })
  await expect(
    page.getByRole('button', { name: new RegExp(`Account: ${expectedAccountName(creds)}`, 'i') }),
  ).toBeVisible()
}

/** Open the account menu and log out; expect a redirect back to /login. */
export async function logoutViaUi(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Account:/ }).click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
}
