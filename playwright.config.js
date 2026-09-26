// @ts-check
/**
 * Playwright Test configuration. All values come from config/index.js, which
 * Cucumber also uses, so both runners test the same app the same way.
 * @see https://playwright.dev/docs/test-configuration
 */
const { defineConfig, devices } = require('@playwright/test');
const { config } = require('./config');

const DEVICES = { chromium: 'Desktop Chrome', firefox: 'Desktop Firefox', webkit: 'Desktop Safari' };
const baseURL = config.baseUrl || `http://127.0.0.1:${config.demoAppPort}`;

module.exports = defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: config.isCI,
    retries: config.retries,
    workers: config.workers,
    timeout: config.timeouts.test,
    expect: { timeout: config.timeouts.expect },
    reporter: [['list'], ['allure-playwright'], ['html', { outputFolder: 'html-report', open: 'never' }]],
    use: {
        ...devices[DEVICES[config.browser]],
        baseURL,
        headless: config.headless,
        viewport: config.viewport,
        actionTimeout: config.timeouts.action,
        navigationTimeout: config.timeouts.navigation,
        trace: config.trace,
        video: config.video,
        screenshot: 'only-on-failure',
    },
    globalSetup: require.resolve('./utils/global-setup'),
    projects: [{ name: config.browser }],
    // Starts the bundled demo app unless BASE_URL points at a real application
    webServer: config.useDemoApp
        ? {
              command: 'node demo-app/server.js',
              url: `${baseURL}/`,
              reuseExistingServer: !config.isCI,
              timeout: 30_000,
          }
        : undefined,
});
