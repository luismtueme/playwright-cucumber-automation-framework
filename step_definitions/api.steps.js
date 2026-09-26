const { Given, When, Then } = require('../utils/steps');
const { expect } = require('@playwright/test');
const { ApiClient } = require('../utils/apiClient');
const runtime = require('../utils/cucumberRuntime');

Given('I am authenticated with the API', async function () {
    await this.authedApi();
});

When('I create an item named {string}', async function (name) {
    const api = await this.api();
    const response = await api.post('/api/items', { name });
    this.response = response;
    if (response.status === 201) {
        this.createdItem = response.body;
        this.cleanUpItem(response.body);
    }
});

When('I delete the created item', async function () {
    const api = await this.api();
    this.response = await api.delete(`/api/items/${this.lastItem.id}`);
});

When('I list the items without authenticating', async function () {
    const api = await ApiClient.create({ baseURL: runtime.apiBaseUrl });
    try {
        this.response = await api.get('/api/items');
    } finally {
        await api.dispose();
    }
});

Then('the response status is {int}', function (status) {
    expect(this.lastResponse.status, JSON.stringify(this.lastResponse.body)).toBe(status);
});

Then('the response body matches:', function (docString) {
    expect(this.lastResponse.body).toMatchObject(JSON.parse(docString));
});

Then('the created item can be fetched by its id', async function () {
    const api = await this.api();
    const fetched = await api.get(`/api/items/${this.lastItem.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body).toEqual(this.lastItem);
});
