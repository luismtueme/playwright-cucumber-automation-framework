/**
 * Playwright Configuration File
 * 
 * This file configures Playwright test runner settings including browser configurations,
 * test directories, reporting options, and execution parameters.
 * 
 * @author Your Name
 * @version 1.0.0
 * @since 2024
 */

// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  timeout: 50 * 10000,
  expect: {
    timeout: 10000
  },
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter:[
      ['list'],
      ['allure-playwright'],
      ['html', {
        outputFolder: 'html-report'
      }],
      ['html']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
            // baseURL: 'https://your-application.com',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    headless: false, // Run tests in headless mode
    screenshot: 'only-on-failure', // Take screenshot only when a test fails
    video: 'retain-on-failure' // Capture video only when a test fails
  },
  globalSetup: require.resolve('./utils/global-setup'),
  /* Configure projects for major browsers */
  projects: [
    // {
    //   name: 'chromium',
    //   use: {
    //     ...devices['Desktop Chrome'], // Use the preset for Desktop Chrome
    //     viewport: { width: 1528, height: 800 }, // Your custom viewport
    //     launchOptions: {
    //       args: [
    //         '--disable-accelerated-video-decode', // Disable hardware acceleration for video
    //         '--disable-gpu',                     // Disable GPU rendering
    //         '--disable-features=LazyImageLoading', // Disable lazy loading for resources
    //         '--disable-cache',                   // Disable caching for the session
    //       ]
    //     }
    //   }
    // },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'],
      viewport:{width:1528,height:800}
      }
    },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});

