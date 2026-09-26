const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const { requireCredentials } = require('../config');
const { ApiClient } = require('../utils/apiClient');
const runtime = require('../utils/cucumberRuntime');

Given('I am authenticated with the API', async function () {
    const { username, password } = requireCredentials(this.config);
    const api = await this.api();
    await api.login(username, password);
});

When('I create an item named {string}', async function (name) {
    const api = await this.api();
    this.response = await api.post('/api/items', { name });
    if (this.response.status === 201) this.createdItem = this.response.body;
});

When('I delete the created item', async function () {
    const api = await this.api();
    this.response = await api.delete(`/api/items/${this.createdItem.id}`);
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
    expect(this.response.status, JSON.stringify(this.response.body)).toBe(status);
});

Then('the response body matches:', function (docString) {
    expect(this.response.body).toMatchObject(JSON.parse(docString));
});

Then('the created item can be fetched by its id', async function () {
    const api = await this.api();
    const fetched = await api.get(`/api/items/${this.createdItem.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body).toEqual(this.createdItem);
});
