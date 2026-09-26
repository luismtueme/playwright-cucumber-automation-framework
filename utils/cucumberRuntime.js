/**
 * Per-worker state shared between Cucumber hooks and the World.
 * Each parallel Cucumber worker is a separate process with its own copy.
 */
module.exports = {
    /** @type {import('@playwright/test').Browser | null} */
    browser: null,
    /** Base URL of the app under test (the demo app's URL when BASE_URL is empty) */
    baseUrl: '',
    apiBaseUrl: '',
    /** @type {InstanceType<typeof import('./dbClient').DbClient> | null} */
    db: null,
};
