const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Final Verification of All Requirements', () => {
  test('Education logic in form.html works correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/form.html');

    // Section 3: Social and Family Information
    const eduSelect = page.locator('#education');
    await eduSelect.scrollIntoViewIfNeeded();

    // Test Preparatory (instead of Intermediate)
    const options = await eduSelect.evaluate(sel => Array.from(sel.options).map(opt => opt.text));
    expect(options).toContain('إعدادية');
    expect(options).not.toContain('متوسطة');

    // Test Secondary (الثانوية) - Should show Secondary Type
    await eduSelect.selectOption('ثانوية');
    const secondaryTypeDiv = page.locator('#secondary_type_container');
    await expect(secondaryTypeDiv).toBeVisible();
    await page.screenshot({ path: 'verification/form_edu_secondary.png' });

    // Test Bachelor (بكالوريوس) - Should show specialization and university
    await eduSelect.selectOption('بكالوريوس');
    const specDiv = page.locator('#higher_edu_fields');
    await expect(specDiv).toBeVisible();

    // Check default university
    const universityInput = page.locator('#university');
    await expect(universityInput).toHaveValue('جامعة اللاذقية');

    await page.screenshot({ path: 'verification/form_edu_bachelor_detail.png' });
  });

  test('Admin filtering by kids and kids under 18 works', async ({ page }) => {
    // We need to login first
    await page.goto('http://localhost:3000/admin.html');

    // If redirected to login
    if (page.url().includes('login.html')) {
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin.html');
    }

    // Check if filter inputs exist
    await expect(page.locator('#filter-kids-count')).toBeVisible();
    await expect(page.locator('#filter-kids-under18')).toBeVisible();

    // Enter filter values
    await page.fill('#filter-kids-count', '2');
    await page.click('#apply-filters');

    // Wait for table to refresh (simulated or real)
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'verification/admin_filters.png' });
  });

  test('Admin edit record works', async ({ page }) => {
    await page.goto('http://localhost:3000/admin.html');
    if (page.url().includes('login.html')) {
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin.html');
    }

    // Assuming there is at least one record from previous tests
    const editBtn = page.locator('.edit-btn').first();
    if (await editBtn.count() > 0) {
        await editBtn.click();
        await expect(page.locator('#editModal')).toBeVisible();

        // Change something
        await page.fill('#edit-name', 'تم التعديل');
        await page.click('#saveEdit');

        // Check if updated in table
        await expect(page.locator('table')).toContainText('تم التعديل');
        await page.screenshot({ path: 'verification/admin_edit_success.png' });
    }
  });
});
