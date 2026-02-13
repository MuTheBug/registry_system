const { test, expect } = require('@playwright/test');

test('form submission and admin view', async ({ page }) => {
    // 1. Submit form
    await page.goto('http://localhost:3000/');

    // Section 1
    await page.fill('[name=firstName]', 'احمد');
    await page.fill('[name=fatherName]', 'محمد');
    await page.fill('[name=lastName]', 'العلي');
    await page.selectOption('[name=gender]', 'male');
    await page.fill('[name=motherName]', 'فاطمة');
    await page.selectOption('[name=birthDay]', '1');
    await page.selectOption('[name=birthMonth]', '1');
    await page.selectOption('[name=birthYear]', '1990');
    await page.selectOption('[name=province]', 'اللاذقية');
    await page.fill('[name=nationalId]', '01234567890');
    await page.selectOption('[name=bloodType]', 'O+');

    // Section 2
    await page.selectOption('[name=arrestDay]', '5');
    await page.selectOption('[name=arrestMonth]', '5');
    await page.selectOption('[name=arrestYear]', '2015');
    await page.selectOption('[name=arrestPlace]', 'السجن المدني');
    await page.fill('[name=arrestAuthority]', 'المخابرات');
    await page.fill('[name=arrestReason]', 'سياسي');
    await page.click('#st_survivor');
    await page.selectOption('[name=releaseDay]', '10');
    await page.selectOption('[name=releaseMonth]', '10');
    await page.selectOption('[name=releaseYear]', '2020');

    // Section 3
    await page.click('#m_married');
    await page.fill('[name=spouseName]', 'زينب');
    await page.click('#hk_y');
    await page.fill('#kidsCount', '1');
    // Child 1
    await page.fill('[name="cName_kidsBox_1"]', 'عمر');
    await page.fill('[name="cAge_kidsBox_1"]', '5');
    await page.selectOption('[name="cEdu_kidsBox_1"]', 'ابتدائية');
    await page.selectOption('[name="cHP_kidsBox_1"]', 'sick');
    await page.fill('#cDiseaseInp_kidsBox_1', 'ربو');
    await page.click('button:has-text("إضافة")'); // there are multiple addition buttons, need to be careful
    // Actually let's use a more specific selector
    await page.click('#cSickBox_kidsBox_1 button:has-text("إضافة")');

    // Section 4
    await page.fill('[name=address]', 'اللاذقية - المشروع السابع');
    await page.selectOption('[name=housingType]', 'ملك');

    // Section 5
    await page.click('#emp_y');
    await page.fill('[name=profession]', 'نجار');

    // Section 6 (Health)
    await page.click('#chr_y');
    await page.check('#ch_hyp');
    await page.fill('#otherDiseaseInp', 'حساسية');
    await page.click('#sec_chronic button:has-text("إضافة")');
    await page.check('#sn_y');
    await page.fill('[name=specialNeedsDetails]', 'صعوبة في الحركة');

    // Section 7
    await page.selectOption('[name=education]', 'بكالوريوس');
    await page.fill('[name=eduSpecialization]', 'هندسة');
    // university is default

    // Submit
    await page.click('button:has-text("حفظ البيانات")');

    // Wait for success
    await page.waitForSelector('.notification:has-text("تم حفظ البيانات بنجاح")');

    // 2. Login to admin
    await page.goto('http://localhost:3000/login');
    await page.fill('[name=password]', 'admin123');
    await page.click('button:has-text("دخول")');

    // 3. View record
    await page.waitForURL('http://localhost:3000/admin');
    await page.click('.act-view');

    // 4. Check details
    await expect(page.locator('#modalBody')).toContainText('احمد');
    await expect(page.locator('#modalBody')).toContainText('ضغط');
    await expect(page.locator('#modalBody')).toContainText('حساسية');
    await expect(page.locator('#modalBody')).toContainText('صعوبة في الحركة');
    await expect(page.locator('#modalBody')).toContainText('ربو');
    await expect(page.locator('#modalBody')).toContainText('جامعة اللاذقية');

    console.log('Test passed!');
});
