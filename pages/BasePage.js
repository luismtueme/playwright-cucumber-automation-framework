/**
 * Base class for page objects.
 *
 * Page objects expose Playwright Locators and user-level actions. Keep assertions
 * in steps and specs (with `expect`), so failures point at the test, and rely on
 * Playwright's auto-waiting rather than explicit waits.
 */
class BasePage {
    /** Path relative to the base URL, overridden by each page. */
    static path = '/';

    /** @param {import('@playwright/test').Page} page */
    constructor(page) {
        this.page = page;
    }

    async open() {
        await this.page.goto(/** @type {typeof BasePage} */ (this.constructor).path);
    }
}

module.exports = { BasePage };
