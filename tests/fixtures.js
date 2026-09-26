/**
 * Custom Playwright Test fixtures. Import `test` and `expect` from here instead of
 * '@playwright/test' to get page objects, API clients and test data injected:
 *
 *   test('...', async ({ itemsPage, createItem }) => { ... })
 *
 * Browser tests start logged in (session saved once by tests/auth.setup.js).
 * Use `test.use({ storageState: LOGGED_OUT })` for tests that need a fresh visitor.
 */
const base = require('@playwright/test');
const { config, requireCredentials } = require('../config');
const { ApiClient } = require('../utils/apiClient');
const { FormPage } = require('../pages/FormPage');
const { LoginPage } = require('../pages/LoginPage');
const { ItemsPage } = require('../pages/ItemsPage');
const { findAccessibilityViolations, formatViolations } = require('../utils/accessibility');

const { expect } = base;

/** storageState for a visitor with no session */
const LOGGED_OUT = { cookies: [], origins: [] };

/** @typedef {{ id: number, name: string, createdAt: string }} Item */

/**
 * @typedef {object} Fixtures
 * @property {{ username: string, password: string }} credentials
 * @property {InstanceType<typeof FormPage>} formPage
 * @property {InstanceType<typeof LoginPage>} loginPage
 * @property {InstanceType<typeof ItemsPage>} itemsPage
 * @property {InstanceType<typeof ApiClient>} api
 * @property {InstanceType<typeof ApiClient>} authedApi
 * @property {(item: { id: number }) => void} trackItem
 * @property {(overrides?: { name?: string }) => Promise<Item>} createItem
 * @property {(options?: { exclude?: string[], disableRules?: string[] }) => Promise<void>} checkAccessibility
 *   Runs axe on the current page, attaches the results, and fails on any violation
 */

/**
 * @typedef {import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions} TestArgs
 * @typedef {import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions} WorkerArgs
 */

const test = base.test.extend(
    /** @type {import('@playwright/test').Fixtures<Fixtures, {}, TestArgs, WorkerArgs>} */ ({
        credentials: async ({}, use) => {
            await use(requireCredentials(config));
        },

        formPage: async ({ page }, use) => {
            await use(new FormPage(page));
        },
        loginPage: async ({ page }, use) => {
            await use(new LoginPage(page));
        },
        itemsPage: async ({ page }, use) => {
            await use(new ItemsPage(page));
        },

        checkAccessibility: async ({ page }, use, testInfo) => {
            await use(async (options) => {
                const violations = await findAccessibilityViolations(page, options);
                await testInfo.attach('accessibility-violations.json', {
                    body: JSON.stringify(violations, null, 2),
                    contentType: 'application/json',
                });
                expect(violations, formatViolations(violations)).toEqual([]);
            });
        },

        /**
         * Unauthenticated API client. Uses its own request context, so it never carries
         * the saved browser session.
         */
        api: async ({ playwright, baseURL }, use) => {
            const context = await playwright.request.newContext({
                baseURL: config.apiBaseUrl || baseURL,
                // Playwright applies the test's storageState to new request contexts too
                storageState: LOGGED_OUT,
            });
            await use(new ApiClient(context));
            await context.dispose();
        },

        /** API client logged in with the configured credentials. */
        authedApi: async ({ playwright, baseURL, credentials }, use) => {
            const context = await playwright.request.newContext({
                baseURL: config.apiBaseUrl || baseURL,
                // Playwright applies the test's storageState to new request contexts too
                storageState: LOGGED_OUT,
            });
            const api = new ApiClient(context);
            await api.login(credentials.username, credentials.password);
            await use(api);
            await context.dispose();
        },

        /**
         * Registers items for deletion after the test, whether it passes or fails.
         * Use for items created outside createItem (for example through the UI).
         */
        trackItem: async ({ authedApi }, use) => {
            /** @type {number[]} */
            const ids = [];
            await use((item) => ids.push(item.id));
            for (const id of ids.reverse()) {
                const { status } = await authedApi.delete(`/api/items/${id}`);
                // 404: the test already deleted it
                if (status !== 204 && status !== 404) throw new Error(`Cleanup of item ${id} failed: HTTP ${status}`);
            }
        },

        /** Test data factory: creates an item through the API and deletes it after the test. */
        createItem: async ({ authedApi, trackItem }, use) => {
            await use(async (overrides = {}) => {
                const name = overrides.name ?? `Test item ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                const response = await authedApi.post('/api/items', { name, ...overrides });
                if (response.status !== 201) throw new Error(`createItem failed: HTTP ${response.status}`);
                trackItem(response.body);
                return response.body;
            });
        },
    }),
);

/**
 * Returns `value`, or throws `message` if it's null or undefined. Narrows the type
 * for the code after it, without an `if` in the test body.
 * @template T
 * @param {T | null | undefined} value
 * @param {string} message
 * @returns {T}
 */
function defined(value, message) {
    if (value === null || value === undefined) throw new Error(message);
    return value;
}

module.exports = { test, expect, LOGGED_OUT, defined };
