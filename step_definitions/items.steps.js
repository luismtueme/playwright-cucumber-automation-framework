const { Given, When, Then } = require('../utils/steps');
const { expect } = require('@playwright/test');

Given('I am on the items page', async function () {
    await this.itemsPage.open();
});

Given('an item named {string} exists', async function (name) {
    const response = await (await this.authedApi()).post('/api/items', { name });
    expect(response.status).toBe(201);
    this.cleanUpItem(response.body);
});

When('I add an item named {string} on the items page', async function (name) {
    const item = await this.itemsPage.addItem(name);
    if (!item) throw new Error(`The app rejected "${name}"`);
    this.createdItem = { id: item.id, name: item.name };
    this.cleanUpItem(item);
});

Then('I see the items page', async function () {
    await expect(this.itemsPage.page).toHaveURL(/\/items$/);
    await expect(this.itemsPage.heading).toBeVisible();
});

Then('the items list shows {string}', async function (name) {
    await expect(this.itemsPage.item(name)).toBeVisible();
});

Then('the API returns the item added on the page', async function () {
    const response = await (await this.authedApi()).get(`/api/items/${this.lastItem.id}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ name: this.lastItem.name });
});
