import { expect, test } from '@playwright/test'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerViaUi } from './helpers/auth'

const AVATAR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'avatar.png')

/**
 * Avatar lifecycle through the real UI:
 *  - a fresh account shows the neutral UserCircle placeholder (no <img>) in both
 *    the Settings card and the top nav;
 *  - uploading reflects the served /media/:id image in BOTH places (regression
 *    for the nav previously pinned to a static placeholder);
 *  - removing reverts both to the icon and deletes the stored asset.
 *
 * Needs the backend stack up (no email — the app runs with verification off).
 */
test('avatar upload reflects in the top nav; remove reverts to the neutral icon', async ({ page }) => {
  test.setTimeout(60_000)

  const email = `avatar-${Date.now()}@crewfinding.test`
  await registerViaUi(page, { email, password: 'TestPassw0rd!2026' })

  await page.goto('/settings')

  const navImg = page.getByRole('button', { name: /^Account:/ }).locator('img')
  const cardImg = page.locator('#profile img')

  // Fresh account: gender-neutral icon placeholder — no <img> in either spot.
  await expect(navImg).toHaveCount(0)
  await expect(cardImg).toHaveCount(0)

  // The "Change" input is hidden; setInputFiles fires its change handler.
  await page.setInputFiles('input[type="file"]', AVATAR)
  await expect(page.getByText('Avatar updated')).toBeVisible({ timeout: 20_000 })

  // Both the profile card AND the nav bar now render the served asset.
  await expect(cardImg).toHaveAttribute('src', /\/media\//, { timeout: 15_000 })
  await expect(navImg).toHaveAttribute('src', /\/media\//, { timeout: 15_000 })
  const uploadedUrl = await navImg.getAttribute('src')
  expect(await cardImg.getAttribute('src')).toBe(uploadedUrl)

  // Remove reverts both to the neutral icon (no <img>) and deletes the asset.
  await page.locator('#profile').getByRole('button', { name: 'Remove' }).click()
  await expect(page.getByText('Avatar removed')).toBeVisible({ timeout: 20_000 })
  await expect(cardImg).toHaveCount(0, { timeout: 15_000 })
  await expect(navImg).toHaveCount(0, { timeout: 15_000 })
  expect((await page.request.get(uploadedUrl as string)).status()).toBe(404)
})
