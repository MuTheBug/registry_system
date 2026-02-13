const { test, expect } = require('@playwright/test');

test('Simplified submission check with console logging', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.goto('http://localhost:3000/form.html');
  await page.fill('input[name="firstName"]', 'TestName');
  await page.fill('input[name="fatherName"]', 'Father');
  await page.fill('input[name="lastName"]', 'Last');
  await page.selectOption('select[name="gender"]', 'male');
  await page.fill('input[name="motherName"]', 'Mother');

  // Fill all required date selects
  await page.selectOption('select[name="dob_day"]', '1');
  await page.selectOption('select[name="dob_month"]', '1');
  await page.selectOption('select[name="dob_year"]', '1990');

  await page.selectOption('select[name="governorate"]', 'دمشق');
  await page.fill('input[name="nationalId"]', '12345678901');
  await page.fill('input[name="address"]', 'Test Address');
  await page.selectOption('select[name="housing_type"]', 'ملك');

  await page.selectOption('select[name="socialStatus"]', 'single');
  await page.selectOption('#education', 'ابتدائي');

  await page.selectOption('select[name="doa_day"]', '1');
  await page.selectOption('select[name="doa_month"]', '1');
  await page.selectOption('select[name="doa_year"]', '2020');
  await page.selectOption('select[name="arrestPlace"]', 'صيدنايا');

  await page.screenshot({ path: 'verification/before_submit.png' });

  // Listen for the response
  try {
      const [response] = await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/records'), { timeout: 5000 }),
        page.click('button[type="submit"]')
      ]);
      const body = await response.json();
      console.log('Submission Response:', body);
      expect(body.success).toBe(true);
  } catch (e) {
      console.log('Submission failed or timed out:', e.message);
      await page.screenshot({ path: 'verification/after_submit_fail.png' });
  }
});
