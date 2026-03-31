import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login as super-admin successfully', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1, .login-title')).toBeVisible()

    await page.selectOption('select[name="role"], input[name="role"]', 'super-admin')
    await page.fill('input[name="email"]', 'admin@example.com')
    await page.fill('input[name="password"]', 'SuperAdmin123!')
    await page.click('button[type="submit"], [data-testid="login-submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1, .dashboard-title')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1, .login-title')).toBeVisible()

    await page.selectOption('select[name="role"], input[name="role"]', 'super-admin')
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"], [data-testid="login-submit"]')

    await expect(page.locator('.error-message, [role="alert"]')).toBeVisible()
  })
})
