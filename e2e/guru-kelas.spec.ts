import { test, expect } from '@playwright/test'

test.describe('Guru - Kelas CRUD', () => {
  test('should create, edit, and delete kelas', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1, .login-title')).toBeVisible()

    await page.selectOption('select[name="role"], input[name="role"]', 'guru')
    await page.fill('input[name="email"]', 'guru@example.com')
    await page.fill('input[name="password"]', 'Guru123!')
    await page.click('button[type="submit"], [data-testid="login-submit"]')

    await expect(page).toHaveURL('/guru/dashboard')
    await page.goto('/guru/kelas')
    await expect(page.locator('h1, [data-testid="kelas-page-title"]')).toBeVisible()

    const kelasName = `Test Kelas ${Date.now()}`
    await page.click('button:has-text("Tambah Kelas"), [data-testid="add-kelas"]')
    await expect(page.locator('dialog, [role="dialog"], .modal')).toBeVisible()

    await page.fill('input[name="namaKelas"], [placeholder*="Kelas"]', kelasName)
    await page.fill('input[name="tingkatan"], [placeholder*="Tingkatan"]', '10')
    await page.click('button[type="submit"], [data-testid="save-kelas"]')

    await expect(page.locator('.success-message, [role="status"]')).toBeVisible()
    await expect(page.locator(`text=${kelasName}`)).toBeVisible()

    const editKelasName = `${kelasName} - Edited`
    await page.click(`[data-testid="edit-kelas-${kelasName}"], tr:has-text("${kelasName}") [data-testid="edit"]`)
    await expect(page.locator('dialog, [role="dialog"], .modal')).toBeVisible()

    await page.fill('input[name="namaKelas"], [placeholder*="Kelas"]', editKelasName)
    await page.click('button[type="submit"], [data-testid="save-kelas"]')

    await expect(page.locator('.success-message, [role="status"]')).toBeVisible()
    await expect(page.locator(`text=${editKelasName}`)).toBeVisible()

    await page.click(`[data-testid="delete-kelas-${editKelasName}"], tr:has-text("${editKelasName}") [data-testid="delete"]`)
    await page.click('button:has-text("Hapus"), [data-testid="confirm-delete"]')

    await expect(page.locator('.success-message, [role="status"]')).toBeVisible()
    await expect(page.locator(`text=${editKelasName}`)).not.toBeVisible()
  })
})
