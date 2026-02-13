const { test, expect } = require('@playwright/test');

test('Simplified submission check', async ({ page }) => {
  await page.goto('http://localhost:3000/form.html');
  await page.fill('input[name="firstName"]', 'TestName');
  await page.fill('input[name="fatherName"]', 'Father');
  await page.fill('input[name="lastName"]', 'Last');
  await page.selectOption('select[name="gender"]', 'male');
  await page.fill('input[name="motherName"]', 'Mother');
  await page.selectOption('select[name="dob_day"]', '1');
  await page.selectOption('select[name="dob_month"]', '1');
  await page.selectOption('select[name="dob_year"]', '1990');
  await page.selectOption('select[name="governorate"]', 'اللاذقية');
  await page.fill('input[name="nationalId"]', '12312312312');
  await page.fill('input[name="address"]', 'Address');
  await page.selectOption('select[name="housing_type"]', 'ملك');
  await page.selectOption('#education', 'بكالوريوس');
  await page.selectOption('select[name="doa_day"]', '1');
  await page.selectOption('select[name="doa_month"]', '1');
  await page.selectOption('select[name="doa_year"]', '2015');
  await page.selectOption('select[name="socialStatus"]', 'single');
  await page.selectOption('select[name="arrestPlace"]', 'صيدنايا');

  // Listen for the response
  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/api/records') && res.status() === 200),
    page.click('button[type="submit"]')
  ]);

  const body = await response.json();
  console.log('Submission Response:', body);
  expect(body.success).toBe(true);
});
