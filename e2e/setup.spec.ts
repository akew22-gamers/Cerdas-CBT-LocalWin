import { test, expect } from '@playwright/test'

test.describe('Setup Wizard', () => {
  test('should complete setup wizard flow', async ({ page }) => {
    await page.goto('/setup')
    await expect(page.locator('h1, .setup-title')).toBeVisible()

    const setupToken = 'SETUP_TOKEN_123'
    await page.fill('input[name="setupToken"]', setupToken)
    await page.click('button[type="submit"], [data-testid="submit-token"]')
    await expect(page.locator('.create-admin-section')).toBeVisible()

    const adminEmail = 'admin@example.com'
    const adminPassword = 'SuperAdmin123!'
    await page.fill('input[name="email"]', adminEmail)
    await page.fill('input[name="password"]', adminPassword)
    await page.fill('input[name="confirmPassword"]', adminPassword)
    await page.click('button[type="submit"], [data-testid="create-admin"]')
    await expect(page.locator('.school-info-section')).toBeVisible()

    const schoolName = 'Test School'
    await page.fill('input[name="schoolName"]', schoolName)
    await page.fill('input[name="npsn"]', '12345678')
    await page.fill('input[name="address"]', 'Jl. Test No. 123')
    await page.click('button[type="submit"], [data-testid="complete-setup"]')

    await expect(page).toHaveURL('/login')
    await expect(page.locator('h1')).toContainText('Login')
  })
})
