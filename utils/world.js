/**
 * Cucumber World: per-scenario state available as `this` in steps and hooks.
 *
 *   this.page       Playwright Page (UI scenarios; not created for @api)
 *   this.formPage   page objects, created on first use
 *   this.api()      ApiClient; request/response pairs are attached to the report
 *   this.db         DbClient (@db scenarios)
 *   this.config     shared configuration (config/index.js)
 */
const { setWorldConstructor, World } = require('@cucumber/cucumber');
const { config } = require('../config');
const runtime = require('./cucumberRuntime');
const { ApiClient } = require('./apiClient');
const { FormPage } = require('../pages/FormPage');
const { LoginPage } = require('../pages/LoginPage');

class CustomWorld extends World {
    constructor(options) {
        super(options);
        this.config = config;
        /** @type {import('@playwright/test').BrowserContext | null} */
        this.context = null;
        /** @type {import('@playwright/test').Page | null} */
        this.page = null;
        this.apiClient = null;
        this.pageObjects = new Map();
    }

    get baseUrl() {
        return runtime.baseUrl;
    }

    get db() {
        if (!runtime.db) throw new Error('Database is not configured. Set DB_HOST (see .env.example).');
        return runtime.db;
    }

    /** Returns a page object bound to this scenario's page, creating it once. */
    pageObject(PageClass) {
        if (!this.page) throw new Error('No browser page: this scenario is tagged @api.');
        if (!this.pageObjects.has(PageClass)) this.pageObjects.set(PageClass, new PageClass(this.page));
        return this.pageObjects.get(PageClass);
    }

    get formPage() {
        return this.pageObject(FormPage);
    }

    get loginPage() {
        return this.pageObject(LoginPage);
    }

    async api() {
        if (!this.apiClient) {
            this.apiClient = await ApiClient.create({
                baseURL: runtime.apiBaseUrl,
                onExchange: (exchange) =>
                    this.attach(JSON.stringify(exchange, null, 2), {
                        mediaType: 'application/json',
                        fileName: `${exchange.request.method} ${exchange.request.path}`,
                    }),
            });
        }
        return this.apiClient;
    }

    async openPage() {
        this.context = await runtime.browser.newContext({
            baseURL: runtime.baseUrl,
            viewport: config.viewport,
            recordVideo: config.video === 'off' ? undefined : { dir: 'videos', size: config.viewport },
        });
        if (config.trace !== 'off') {
            await this.context.tracing.start({ screenshots: true, snapshots: true, sources: true });
        }
        this.page = await this.context.newPage();
        this.page.setDefaultTimeout(config.timeouts.action);
        this.page.setDefaultNavigationTimeout(config.timeouts.navigation);
    }
}

setWorldConstructor(CustomWorld);

module.exports = { CustomWorld };
