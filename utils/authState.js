/**
 * Saved login session shared by both runners.
 *
 * Playwright Test: tests/auth.setup.js writes AUTH_FILE once per run.
 * Cucumber: getAuthState() logs in once per worker and keeps the state in memory.
 * The file holds live session cookies, so .auth/ is git-ignored.
 */
const path = require('path');
const { request } = require('@playwright/test');
const { config, requireCredentials, ROOT } = require('../config');

const AUTH_FILE = path.join(ROOT, '.auth', 'user.json');

let pending = null;

/**
 * Logs in via the API and returns a Playwright storageState object. Memoized, so
 * each process logs in once.
 * @param {string} baseURL
 */
function getAuthState(baseURL) {
    pending ??= (async () => {
        const { username, password } = requireCredentials(config);
        const context = await request.newContext({ baseURL });
        try {
            const response = await context.post('/api/login', { data: { username, password } });
            if (!response.ok()) throw new Error(`Login for saved session failed: HTTP ${response.status()}`);
            return await context.storageState();
        } finally {
            await context.dispose();
        }
    })();
    return pending;
}

module.exports = { AUTH_FILE, getAuthState };
