const { test, expect } = require('@playwright/test');

test.describe('Functional Verification with Logging', () => {
  test('Form submission and Admin check', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    const uniqueName = 'Samer' + Date.now();
    await page.goto('http://localhost:3000/form.html');

    await page.fill('input[name="firstName"]', uniqueName);
    await page.fill('input[name="fatherName"]', 'محمد');
    await page.fill('input[name="lastName"]', 'العلي');
    await page.selectOption('select[name="gender"]', 'male');
    await page.fill('input[name="motherName"]', 'فاطمة');
    await page.selectOption('select[name="dob_day"]', '1');
    await page.selectOption('select[name="dob_month"]', '1');
    await page.selectOption('select[name="dob_year"]', '1990');
    await page.selectOption('select[name="governorate"]', 'اللاذقية');
    await page.fill('input[name="nationalId"]', '99988877766');
    await page.fill('input[name="address"]', 'اللاذقية - المشروع الأول');
    await page.selectOption('select[name="housing_type"]', 'ملك');
    await page.selectOption('#education', 'بكالوريوس');
    await page.selectOption('select[name="doa_day"]', '1');
    await page.selectOption('select[name="doa_month"]', '1');
    await page.selectOption('select[name="doa_year"]', '2015');
    await page.selectOption('select[name="socialStatus"]', 'single');
    await page.selectOption('select[name="arrestPlace"]', 'صيدنايا');

    // Handle alert
    let alertText = '';
    page.on('dialog', async dialog => {
      alertText = dialog.message();
      await dialog.accept();
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('Final Alert Text:', alertText);

    // Now go to admin
    await page.goto('http://localhost:3000/admin.html');
    if (page.url().includes('login.html')) {
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit Prod"]'); // Wait, typo in my thought? No.
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin.html');
    }

    await expect(page.locator('table')).toContainText(uniqueName);
  });
});
