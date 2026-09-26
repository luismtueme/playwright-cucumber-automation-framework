const { BasePage } = require('./BasePage');

/** Demo app form page ("/"). */
class FormPage extends BasePage {
    static path = '/';

    /** @param {import('@playwright/test').Page} page */
    constructor(page) {
        super(page);
        this.heading = page.getByRole('heading', { level: 1 });
        this.exampleButton = page.getByRole('button', { name: 'Run example action' });
        this.result = page.getByText('Example action completed');
        this.input = page.getByLabel('Example input');
        this.submitButton = page.getByRole('button', { name: 'Submit' });
        this.message = page.getByRole('status');
    }

    async runExampleAction() {
        await this.exampleButton.click();
    }

    /** @param {string} value */
    async submit(value) {
        await this.input.fill(value);
        await this.submitButton.click();
    }
}

module.exports = { FormPage };
