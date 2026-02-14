const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  // iPhone 12 is 390x844
  const context = await browser.newContext({
    ...devices['iPhone 12'],
    locale: 'ar-SA',
    isMobile: true
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000');

  // Fill some data to get to kids section
  await page.click('label[for="m_married"]');
  await page.click('label[for="hk_y"]');
  await page.fill('#kidsCount', '1');

  // Open sick section for kid 1
  const kid1SickSelect = page.locator('select[name="cHP_kidsBox_1"]');
  await kid1SickSelect.selectOption('sick');

  // Scroll to kids health section
  await page.locator('#cSickBox_kidsBox_1').scrollIntoViewIfNeeded();

  // Take screenshot
  await page.screenshot({ path: 'verification/mobile_kids_health.png', fullPage: false });

  console.log('Mobile screenshot saved to verification/mobile_kids_health.png');

  await browser.close();
})();
