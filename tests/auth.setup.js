/**
 * Logs in once and saves the session (cookies + local storage) to AUTH_FILE.
 * Browser tests then start already logged in, instead of going through the login
 * page every time. Runs as the "setup" project before the browser project.
 *
 * Logging in via the API is faster than the UI; the login page itself is covered
 * by tests/ui/login.spec.js. For your app, change the endpoint and payload below
 * (or log in through the UI with a page object).
 */
const { test: setup, expect } = require('@playwright/test');
const { config, requireCredentials } = require('../config');
const { AUTH_FILE } = require('../utils/authState');

setup('authenticate', async ({ request }) => {
    const { username, password } = requireCredentials(config);
    const response = await request.post('/api/login', { data: { username, password } });
    expect(response.status(), await response.text()).toBe(200);
    await request.storageState({ path: AUTH_FILE });
});
