/**
 * Cucumber lifecycle hooks.
 *
 * Per worker: start the demo app (unless BASE_URL is set), launch one browser,
 * open the DB pool. Per scenario: a fresh browser context (skipped for @api).
 * On failure: screenshot, Playwright trace and video are attached to Allure.
 */
const {
    Before,
    After,
    BeforeAll,
    AfterAll,
    Status,
    setDefaultTimeout,
    setDefinitionFunctionWrapper,
} = require('@cucumber/cucumber');
const { chromium, firefox, webkit } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { config } = require('../config');
const runtime = require('../utils/cucumberRuntime');
const { DbClient } = require('../utils/dbClient');
const { writeAllureMetadata } = require('../utils/allureMetadata');
const { startDemoApp } = require('../demo-app/server');
const { createLogger } = require('../utils/logger');
require('../utils/world');
const { wrapStepFunction } = require('../utils/stepErrorStatus');

const log = createLogger('hooks');
const BROWSER_TYPES = { chromium, firefox, webkit };
let demoApp = null;

setDefaultTimeout(config.timeouts.test);
// Report Playwright assertion failures as "failed" (not "broken") in Allure
setDefinitionFunctionWrapper(wrapStepFunction);

BeforeAll(async function () {
    if (config.useDemoApp) {
        // Port 0: every parallel worker gets its own demo app on a free port
        demoApp = await startDemoApp({ port: 0 });
        log.debug(`Demo app started at ${demoApp.url}`);
    }
    runtime.baseUrl = demoApp ? demoApp.url : config.baseUrl;
    runtime.apiBaseUrl = config.apiBaseUrl || runtime.baseUrl;
    runtime.browser = await BROWSER_TYPES[config.browser].launch({ headless: config.headless });
    if (config.db) runtime.db = new DbClient(config.db);

    // One worker writes report metadata (CUCUMBER_WORKER_ID is unset when not parallel)
    if (!process.env.CUCUMBER_WORKER_ID || process.env.CUCUMBER_WORKER_ID === '0') {
        writeAllureMetadata({ baseUrl: config.useDemoApp ? '(demo app)' : runtime.baseUrl });
    }
});

Before({ tags: 'not @api' }, async function () {
    await this.openPage();
});

After(async function ({ pickle, result }) {
    const failed = result.status === Status.FAILED;
    const slug = `${pickle.name.replace(/[^a-z0-9]+/gi, '_')}_${Date.now()}`;

    if (this.page && failed) {
        await this.attach(await this.page.screenshot({ fullPage: true }), {
            mediaType: 'image/png',
            fileName: 'screenshot.png',
        });
    }

    if (this.context && config.trace !== 'off') {
        if (failed || config.trace === 'on') {
            const tracePath = path.join('traces', `${slug}.zip`);
            await this.context.tracing.stop({ path: tracePath });
            await this.attach(fs.readFileSync(tracePath), { mediaType: 'application/zip', fileName: 'trace.zip' });
        } else {
            await this.context.tracing.stop();
        }
    }

    // The video file is complete only after its context closes
    const video = this.page?.video();
    await this.context?.close();
    if (video) {
        const videoPath = await video.path();
        if (failed || config.video === 'on') {
            await this.attach(fs.readFileSync(videoPath), { mediaType: 'video/webm', fileName: 'video.webm' });
        } else {
            fs.rmSync(videoPath, { force: true });
        }
    }

    await this.apiClient?.dispose();
});

AfterAll(async function () {
    await runtime.browser?.close();
    await runtime.db?.close();
    await demoApp?.close();
});
