const { Then } = require('../utils/steps');
const { expect } = require('@playwright/test');

Then('the database has the created item named {string}', async function (name) {
    const row = await this.db.one('SELECT id, name FROM items WHERE id = ?', [this.lastItem.id]);
    expect(row).toEqual({ id: this.lastItem.id, name });
});

Then('the database no longer has the created item', async function () {
    expect(await this.db.count('items', 'id = ?', [this.lastItem.id])).toBe(0);
});
