/**
 * HTTP client for API tests, built on Playwright's APIRequestContext.
 *
 * Works in both runners: pass a request context in Playwright Test, or let
 * `ApiClient.create()` make one in Cucumber. Responses are returned as plain
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

/**
 * @typedef {{ status: number, headers: Record<string, string>, body: any }} ApiResponse
 * @typedef {{ data?: unknown, params?: Record<string, string | number | boolean>, headers?: Record<string, string> }} RequestOptions
 * @typedef {{ request: { method: string, path: string, params?: unknown, headers: Record<string, string>, body?: unknown }, response: ApiResponse }} Exchange
 * @typedef {{ baseURL?: string, onExchange?: (exchange: Exchange) => void | Promise<void> }} ClientOptions
 *   baseURL prefixes relative paths when it differs from the context's own baseURL.
 *   onExchange receives every request/response pair (already redacted), e.g. to attach it to a report.
 */

/**
 * Masks sensitive fields so credentials never reach logs or reports.
 * @template T
 * @param {T} value
 * @returns {T}
 */
function redact(value) {
    if (Array.isArray(value)) return /** @type {T} */ (value.map(redact));
    if (value && typeof value === 'object') {
        return /** @type {T} */ (
            Object.fromEntries(
                Object.entries(value).map(([key, v]) => [key, SENSITIVE_KEYS.test(key) ? '***' : redact(v)]),
            )
        );
    }
    return value;
}

class ApiClient {
    /**
     * @param {import('@playwright/test').APIRequestContext} context
     * @param {ClientOptions} [options]
     */
    constructor(context, { baseURL, onExchange } = {}) {
        this.context = context;
        this.baseURL = baseURL;
        this.onExchange = onExchange;
        /** @type {string | null} */
        this.token = null;
        /** True when this client created the context and must dispose it */
        this.ownsContext = false;
    }

    /** @param {ClientOptions & { baseURL: string }} options */
    static async create({ baseURL, ...options }) {
        const context = await request.newContext({ baseURL });
        const client = new ApiClient(context, options);
        client.ownsContext = true;
        return client;
    }

    /**
     * Logs in via POST /api/login and uses the returned token for later requests.
     * @param {string} username
     * @param {string} password
     */
    async login(username, password) {
        const response = await this.post('/api/login', { username, password });
        if (response.status !== 200) {
            throw new Error(`Login failed with HTTP ${response.status}: ${JSON.stringify(response.body)}`);
        }
        this.token = response.body.token;
        return response;
    }

    /** @param {string} path @param {RequestOptions} [options] */
    get(path, options) {
        return this.send('GET', path, options);
    }

    /** @param {string} path @param {unknown} [data] @param {RequestOptions} [options] */
    post(path, data, options) {
        return this.send('POST', path, { ...options, data });
    }

    /** @param {string} path @param {unknown} [data] @param {RequestOptions} [options] */
    put(path, data, options) {
        return this.send('PUT', path, { ...options, data });
    }

    /** @param {string} path @param {RequestOptions} [options] */
    delete(path, options) {
        return this.send('DELETE', path, options);
    }

    /**
     * @param {string} method
     * @param {string} path
     * @param {RequestOptions} [options]
     * @returns {Promise<ApiResponse>}
     */
    async send(method, path, { data, params, headers = {} } = {}) {
        /** @type {Record<string, string>} */
        const allHeaders = { ...headers };
        if (this.token) allHeaders.Authorization = `Bearer ${this.token}`;

        const url = this.baseURL && path.startsWith('/') ? `${this.baseURL}${path}` : path;
        const response = await this.context.fetch(url, { method, data, params, headers: allHeaders });
        const text = await response.text();
        /** @type {any} */
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
