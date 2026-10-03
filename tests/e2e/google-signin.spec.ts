import { expect, test } from '@playwright/test'

/**
 * The Google button is rendered from the SERVER's answer, never a build-time
 * flag — so these tests drive the real contract rather than a mock of it:
 *
 *   GET /auth/providers  ->  app decides whether to draw the button
 *   click                ->  TOP-LEVEL navigation to /auth/google/start
 *
 * The navigation matters as much as the button. googleInit sets the CSRF
 * `oauth_state` cookie on the API's origin; a cross-site fetch() cannot
 * reliably store it, and the callback would then reject every sign-in as a
 * state mismatch. A click that issues an XHR instead of navigating is a
 * regression even though the button still "works" on screen.
 *
 * Requires the backend stack running (see tests/e2e/README.md). Skips cleanly
 * when the API has no Google credentials, which is the normal local state.
 */

const API = process.env['VITE_API_URL'] ?? 'http://localhost:3000'

async function serverOffersGoogle(request: { get: (u: string) => Promise<{ json: () => Promise<unknown> }> }) {
	try {
		const res = await request.get(`${API}/auth/providers`)
		const body = (await res.json()) as { result?: { providers?: string[] } }
		return body.result?.providers?.includes('google') ?? false
	} catch {
		return false
	}
}

test.describe('Google sign-in', () => {
	test('the button appears only when the API offers google', async ({ page, request }) => {
		const offered = await serverOffersGoogle(request)
		await page.goto('/login')
		const button = page.getByRole('button', { name: /google/i })

		if (offered) {
			await expect(button).toBeVisible()
		} else {
			// Not "hidden for now" — the app must not offer a provider the API
			// cannot complete, or the user lands on Google's error page.
			await expect(button).toHaveCount(0)
		}
	})

	test('clicking NAVIGATES to the API start route, rather than fetching it', async ({ page, request }) => {
		test.skip(!(await serverOffersGoogle(request)), 'API has no google credentials configured')
		await page.goto('/login')

		const [req] = await Promise.all([
			page.waitForRequest((r) => r.url().includes('/auth/google/start')),
			page.getByRole('button', { name: /google/i }).click(),
		])
		expect(req.isNavigationRequest()).toBe(true)
	})

	test('an expired or reused code fails closed, without leaking the reason', async ({ page }) => {
		// The handoff code is single-use. A replay (or a stale link) must land
		// the user somewhere recoverable, not on a raw error.
		await page.goto('/auth/callback?code=' + 'f'.repeat(64))
		await expect(page.getByText(/expired|already been used|try again/i)).toBeVisible()
		await expect(page.getByText(/token|bearer|eyJ/i)).toHaveCount(0)
	})
})
