const { BasePage } = require('./BasePage');

/** Demo app items page ("/items"). Requires a logged-in session. */
class ItemsPage extends BasePage {
    static path = '/items';

    /** @param {import('@playwright/test').Page} page */
    constructor(page) {
        super(page);
        this.heading = page.getByRole('heading', { name: 'Items' });
        this.nameInput = page.getByLabel('New item name');
        this.addButton = page.getByRole('button', { name: 'Add item' });
        this.error = page.getByRole('alert');
        this.list = page.getByRole('list', { name: 'Items' });
    }

    /**
     * List entry for an item, located by its visible name.
     * @param {string} name
     */
    item(name) {
        return this.list.getByRole('listitem').filter({ hasText: name });
    }

    /**
     * Adds an item through the UI.
     * @param {string} name
     * @returns {Promise<{ id: number, name: string } | null>} The created item (from the
     *   app's API response, so tests can clean it up), or null if the app rejected it.
     */
    async addItem(name) {
        await this.nameInput.fill(name);
        const [response] = await Promise.all([
            this.page.waitForResponse((r) => r.url().endsWith('/api/items') && r.request().method() === 'POST'),
            this.addButton.click(),
        ]);
        return response.ok() ? response.json() : null;
    }
}

module.exports = { ItemsPage };
