/**
 * HTTP client for API tests, built on Playwright's APIRequestContext.
 *
 * Works in both runners: pass the `request` fixture's context in Playwright Test,
 * or let `ApiClient.create()` make one in Cucumber. Responses are returned as plain
 * objects so assertions stay simple: `expect(res.status).toBe(201)`.
 *
 * @example
 * const api = await ApiClient.create({ baseURL: config.apiBaseUrl });
 * await api.login(username, password);
 * const res = await api.post('/api/items', { name: 'Pipe inspection' });
 * await api.dispose();
 */
const { request } = require('@playwright/test');
const { createLogger } = require('./logger');

const log = createLogger('api');

const SENSITIVE_KEYS = /pass(word)?|secret|token|authorization|api[-_]?key/i;

/** Masks sensitive fields so credentials never reach logs or reports. */
function redact(value) {
    if (Array.isArray(value)) return value.map(redact);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, v]) => [key, SENSITIVE_KEYS.test(key) ? '***' : redact(v)]),
        );
    }
    return value;
}

class ApiClient {
    /**
     * @param {import('@playwright/test').APIRequestContext} context
     * @param {{ baseURL?: string, onExchange?: (exchange: object) => void | Promise<void> }} [options]
     *   baseURL prefixes relative paths when it differs from the context's own baseURL.
     *   onExchange receives every request/response pair, e.g. to attach it to a report.
     */
    constructor(context, { baseURL, onExchange } = {}) {
        this.context = context;
        this.baseURL = baseURL;
        this.onExchange = onExchange;
        this.token = null;
    }

    static async create({ baseURL, ...options }) {
        const context = await request.newContext({ baseURL });
        const client = new ApiClient(context, options);
        client.ownsContext = true;
        return client;
    }

    /** Logs in via POST /api/login and uses the returned token for later requests. */
    async login(username, password) {
        const response = await this.post('/api/login', { username, password });
        if (response.status !== 200) {
            throw new Error(`Login failed with HTTP ${response.status}: ${JSON.stringify(response.body)}`);
        }
        this.token = response.body.token;
        return response;
    }

    get(path, options) {
        return this.send('GET', path, options);
    }

    post(path, data, options) {
        return this.send('POST', path, { ...options, data });
    }

    put(path, data, options) {
        return this.send('PUT', path, { ...options, data });
    }

    delete(path, options) {
        return this.send('DELETE', path, options);
    }

    /**
     * @returns {Promise<{ status: number, headers: Record<string, string>, body: any }>}
     */
    async send(method, path, { data, params, headers = {} } = {}) {
        const allHeaders = { ...headers };
        if (this.token) allHeaders.Authorization = `Bearer ${this.token}`;

        const url = this.baseURL && path.startsWith('/') ? `${this.baseURL}${path}` : path;
        const response = await this.context.fetch(url, { method, data, params, headers: allHeaders });
        const text = await response.text();
        let body = text;
        try {
            body = text ? JSON.parse(text) : null;
        } catch {
            // Non-JSON responses are returned as text
        }

        const result = { status: response.status(), headers: response.headers(), body };
        log.debug(`${method} ${path} -> ${result.status}`);
        if (this.onExchange) {
            await this.onExchange(
                redact({ request: { method, path, params, headers: allHeaders, body: data }, response: result }),
            );
        }
        return result;
    }

    async dispose() {
        if (this.ownsContext) await this.context.dispose();
    }
}

module.exports = { ApiClient, redact };
