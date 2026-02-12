import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        page.on("dialog", lambda dialog: dialog.accept())

        # 1. Registration form checks
        await page.goto("http://localhost:3000")
        await page.select_option('select[name="education"]', "ثانوية")
        await asyncio.sleep(0.5)
        await page.screenshot(path="/home/jules/verification/form_secondary.png")

        await page.select_option('select[name="education"]', "بكالوريوس")
        await asyncio.sleep(0.5)
        await page.screenshot(path="/home/jules/verification/form_higher.png")

        # 2. Login
        await page.goto("http://localhost:3000/admin")
        await page.fill('#password', "admin123")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/admin")

        # 3. Admin View
        await page.wait_for_selector("table")
        await page.screenshot(path="/home/jules/verification/admin_main.png")

        await page.click("text=عرض")
        await page.wait_for_selector("#viewModal", state="visible")
        await page.screenshot(path="/home/jules/verification/admin_view_modal.png")
        await page.click("text=إغلاق")

        # 4. Admin Edit
        await page.click("text=تعديل")
        await page.wait_for_selector("#editModal", state="visible")
        await page.screenshot(path="/home/jules/verification/admin_edit_modal.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
