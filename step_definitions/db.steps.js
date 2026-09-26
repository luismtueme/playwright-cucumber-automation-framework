const { Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

Then('the database has the created item named {string}', async function (name) {
    const row = await this.db.one('SELECT id, name FROM items WHERE id = ?', [this.createdItem.id]);
    expect(row).toEqual({ id: this.createdItem.id, name });
});

Then('the database no longer has the created item', async function () {
    expect(await this.db.count('items', 'id = ?', [this.createdItem.id])).toBe(0);
});
