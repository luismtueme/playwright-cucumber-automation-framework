/**
 * Cucumber World: per-scenario state available as `this` in steps and hooks.
 *
 *   this.page          Playwright Page (UI scenarios; not created for @api).
 *                      @authenticated scenarios start with a saved login session.
 *   this.formPage      page objects, created on first use
 *   this.api()         ApiClient; request/response pairs are attached to the report
 *   this.authedApi()   ApiClient logged in with the configured credentials
 *   this.addCleanup()  registers an async function to run after the scenario
 *   this.db            DbClient (@db scenarios)
 *   this.config        shared configuration (config/index.js)
 */
const { setWorldConstructor, World } = require('@cucumber/cucumber');
const { config, requireCredentials } = require('../config');
const runtime = require('./cucumberRuntime');
const { ApiClient } = require('./apiClient');
const { FormPage } = require('../pages/FormPage');
const { LoginPage } = require('../pages/LoginPage');
const { ItemsPage } = require('../pages/ItemsPage');

/** @typedef {{ id: number, name: string }} Item */

class CustomWorld extends World {
    /** @param {import('@cucumber/cucumber').IWorldOptions} options */
    constructor(options) {
        super(options);
        this.config = config;
        /** @type {import('@playwright/test').BrowserContext | null} */
        this.context = null;
        /** @type {import('@playwright/test').Page | null} */
        this.page = null;
        /** @type {InstanceType<typeof ApiClient> | null} */
        this.apiClient = null;
        /** @type {Map<Function, object>} */
        this.pageObjects = new Map();
        /** @type {import('./apiClient').ApiResponse | null} Last API response, for assertion steps */
        this.response = null;
        /** @type {Item | null} Item created by the scenario, for later steps */
        this.createdItem = null;
        /** @type {Array<() => Promise<void>>} */
        this.cleanups = [];
    }

    /**
     * Registers test data cleanup. Runs after the scenario (pass or fail), last
     * registered first, before the browser and API clients close.
     * @param {() => Promise<void>} fn
     */
    addCleanup(fn) {
        this.cleanups.push(fn);
    }

    /** Runs registered cleanups; returns the errors instead of throwing. */
    async runCleanups() {
        /** @type {Error[]} */
        const errors = [];
        for (const fn of this.cleanups.reverse()) {
            try {
                await fn();
            } catch (error) {
                errors.push(error instanceof Error ? error : new Error(String(error)));
            }
        }
        this.cleanups = [];
        return errors;
    }

    /**
     * Deletes an item after the scenario; a 404 means the scenario already deleted it.
     * @param {Item} item
     */
    cleanUpItem(item) {
        this.addCleanup(async () => {
            const { status } = await (await this.authedApi()).delete(`/api/items/${item.id}`);
            if (status !== 204 && status !== 404) throw new Error(`Cleanup of item ${item.id} failed: HTTP ${status}`);
        });
    }

    get baseUrl() {
        return runtime.baseUrl;
    }

    /** The last API response; throws if no earlier step called the API. */
    get lastResponse() {
        if (!this.response) throw new Error('No API response yet: an earlier step must call the API.');
        return this.response;
    }

    /** The item created by an earlier step; throws if there is none. */
    get lastItem() {
        if (!this.createdItem) throw new Error('No item yet: an earlier step must create one.');
        return this.createdItem;
    }

    get db() {
        if (!runtime.db) throw new Error('Database is not configured. Set DB_HOST (see .env.example).');
        return runtime.db;
    }

    /**
     * Returns a page object bound to this scenario's page, creating it once.
     * @template {object} T
     * @param {new (page: import('@playwright/test').Page) => T} PageClass
     * @returns {T}
     */
    pageObject(PageClass) {
        if (!this.page) throw new Error('No browser page: this scenario is tagged @api.');
        if (!this.pageObjects.has(PageClass)) this.pageObjects.set(PageClass, new PageClass(this.page));
        return /** @type {T} */ (this.pageObjects.get(PageClass));
    }

    get formPage() {
        return this.pageObject(FormPage);
    }

    get loginPage() {
        return this.pageObject(LoginPage);
    }

    get itemsPage() {
        return this.pageObject(ItemsPage);
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

    async authedApi() {
        const api = await this.api();
        if (!api.token) {
            const { username, password } = requireCredentials(this.config);
            await api.login(username, password);
        }
        return api;
    }

    /**
     * @param {{ storageState?: import('@playwright/test').BrowserContextOptions['storageState'] }} [options]
     *   storageState starts the page logged in
     */
    async openPage({ storageState } = {}) {
        if (!runtime.browser) throw new Error('Browser not launched: BeforeAll hook did not run.');
        this.context = await runtime.browser.newContext({
            baseURL: runtime.baseUrl,
            viewport: config.viewport,
            storageState,
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
