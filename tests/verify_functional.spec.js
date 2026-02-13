const { test, expect } = require('@playwright/test');

test.describe('Functional Verification after Reviewer Feedback', () => {
  test('Form submission with all fields works', async ({ page }) => {
    await page.goto('http://localhost:3000/form.html');

    // Fill Basic Info
    await page.fill('input[name="firstName"]', 'سامر');
    await page.fill('input[name="fatherName"]', 'محمد');
    await page.fill('input[name="lastName"]', 'العلي');
    await page.selectOption('select[name="gender"]', 'male');
    await page.fill('input[name="motherName"]', 'فاطمة');

    // Dates
    await page.selectOption('select[name="dob_day"]', '1');
    await page.selectOption('select[name="dob_month"]', '1');
    await page.selectOption('select[name="dob_year"]', '1990');

    await page.selectOption('select[name="governorate"]', 'اللاذقية');
    await page.fill('input[name="nationalId"]', '99988877766');
    await page.fill('input[name="address"]', 'اللاذقية - المشروع الأول');
    await page.selectOption('select[name="housing_type"]', 'ملك');

    // Education
    await page.selectOption('#education', 'بكالوريوس');
    await page.fill('input[name="specialization"]', 'هندسة معلوماتية');

    // Arrest
    await page.selectOption('select[name="doa_day"]', '1');
    await page.selectOption('select[name="doa_month"]', '1');
    await page.selectOption('select[name="doa_year"]', '2015');
    await page.selectOption('select[name="arrestPlace"]', 'فرع الخطيب');

    // Handle alert
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  });

  test('Admin panel displays records correctly (snake_case fix)', async ({ page }) => {
    await page.goto('http://localhost:3000/admin.html');

    if (page.url().includes('login.html')) {
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin.html');
    }

    // Check if Samer is there
    await expect(page.locator('table')).toContainText('سامر محمد العلي');

    const img = page.locator('table img.thumbnail').first();
    await expect(img).toBeVisible();

    await page.screenshot({ path: 'verification/admin_final_check.png' });
  });

  test('Admin filtering works', async ({ page }) => {
    await page.goto('http://localhost:3000/admin.html');
    if (page.url().includes('login.html')) {
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin.html');
    }

    await page.fill('#filter-kids-count', '0');
    await page.click('button:has-text("تطبيق")');

    await expect(page.locator('table')).toContainText('سامر محمد العلي');
  });
});
