const { Given, Then } = require('../utils/steps');
const { expect } = require('@playwright/test');
const { findAccessibilityViolations, formatViolations } = require('../utils/accessibility');

/** @typedef {InstanceType<typeof import('../utils/world').CustomWorld>} World */

/** Page names usable in "Given I open the <name> page" */
const PAGES = {
    form: (/** @type {World} */ world) => world.formPage,
    login: (/** @type {World} */ world) => world.loginPage,
    items: (/** @type {World} */ world) => world.itemsPage,
};

Given('I open the {word} page', async function (name) {
    const pageObject = PAGES[/** @type {keyof typeof PAGES} */ (name)];
    if (!pageObject) throw new Error(`Unknown page "${name}". Known pages: ${Object.keys(PAGES).join(', ')}`);
    await pageObject(this).open();
});

Then('the page has no accessibility violations', async function () {
    if (!this.page) throw new Error('No browser page: accessibility checks need a UI scenario.');
    const violations = await findAccessibilityViolations(this.page);
    await this.attach(JSON.stringify(violations, null, 2), {
        mediaType: 'application/json',
        fileName: 'accessibility-violations.json',
    });
    expect(violations, formatViolations(violations)).toEqual([]);
});
