/**
 * Custom Playwright Test fixtures. Import `test` and `expect` from here instead of
 * '@playwright/test' to get page objects and API clients injected:
 *
 *   test('...', async ({ formPage, authedApi }) => { ... })
 */
const base = require('@playwright/test');
const { config, requireCredentials } = require('../config');
const { ApiClient } = require('../utils/apiClient');
const { FormPage } = require('../pages/FormPage');
const { LoginPage } = require('../pages/LoginPage');

// Only needed when the API lives on a different host than BASE_URL
const apiOptions = {
    baseURL: config.apiBaseUrl && config.apiBaseUrl !== config.baseUrl ? config.apiBaseUrl : undefined,
};

const test = base.test.extend({
    credentials: async ({}, use) => {
        await use(requireCredentials(config));
    },
    formPage: async ({ page }, use) => {
        await use(new FormPage(page));
    },
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    /** Unauthenticated API client on the `request` fixture (shares baseURL and tracing). */
    api: async ({ request }, use) => {
        await use(new ApiClient(request, apiOptions));
    },
    /** API client already logged in with the configured credentials. */
    authedApi: async ({ request, credentials }, use) => {
        const api = new ApiClient(request, apiOptions);
        await api.login(credentials.username, credentials.password);
        await use(api);
    },
});

module.exports = { test, expect: base.expect };
