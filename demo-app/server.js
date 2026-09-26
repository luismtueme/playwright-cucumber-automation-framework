/**
 * Demo application under test.
 *
 * A small web app + JSON API so the example tests have a deterministic target.
 * Point BASE_URL at your real application and delete this folder when you adopt
 * the framework.
 *
 *   Pages:  /            form page
 *           /login       login page (?next=/items returns there after login)
 *           /items       items page, requires a session (redirects to /login)
 *   API:    POST   /api/login        { username, password } -> { token }, also sets a session cookie
 *           GET    /api/items        (auth) list items
 *           POST   /api/items        (auth) { name } -> item
 *           GET    /api/items/:id    (auth)
 *           DELETE /api/items/:id    (auth)
 *
 * API routes accept either "Authorization: Bearer <token>" or the session cookie.
 * Items are kept in memory, or in MySQL when DB_HOST is set (table `items`).
 *
 * Run standalone: node demo-app/server.js  (port: DEMO_APP_PORT, default 4173)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { config, DEMO_CREDENTIALS } = require('../config');

const PUBLIC_DIR = path.join(__dirname, 'public');
/** @type {Record<string, string>} */
const PAGES = { '/': 'index.html', '/login': 'login.html', '/items': 'items.html' };
const PROTECTED_PAGES = new Set(['/items']);
const SESSION_COOKIE = 'session';

/** @typedef {import('http').IncomingMessage} Request */
/** @typedef {import('http').ServerResponse} Response */
/** @typedef {{ id: number, name: string, createdAt: string }} Item */
/**
 * @typedef {object} Store
 * @property {() => Promise<Item[]>} list
 * @property {(name: string) => Promise<Item>} create
 * @property {(id: number) => Promise<Item | null>} get
 * @property {(id: number) => Promise<boolean>} remove
 * @property {() => Promise<void>} close
 */

/** @param {Request} req */
function sessionToken(req) {
    const bearer = (req.headers.authorization || '').match(/^Bearer (.+)$/);
    if (bearer) return bearer[1];
    const cookie = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
    return cookie ? cookie.slice(SESSION_COOKIE.length + 1) : '';
}

/** @returns {Store} */
function createMemoryStore() {
    /** @type {Map<number, Item>} */
    const items = new Map();
    let nextId = 1;
    return {
        async list() {
            return [...items.values()];
        },
        async create(name) {
            const item = { id: nextId++, name, createdAt: new Date().toISOString() };
            items.set(item.id, item);
            return item;
        },
        async get(id) {
            return items.get(id) ?? null;
        },
        async remove(id) {
            return items.delete(id);
        },
        async close() {},
    };
}

/**
 * @param {import('../config').DbConfig} dbConfig
 * @returns {Promise<Store>}
 */
async function createMySqlStore(dbConfig) {
    const { DbClient } = require('../utils/dbClient');
    const db = new DbClient(dbConfig);
    await db.execute(
        `CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
        )`,
    );
    /** @param {import('../utils/dbClient').Row} row @returns {Item} */
    const toItem = (row) => ({ id: row.id, name: row.name, createdAt: new Date(row.created_at).toISOString() });
    return {
        async list() {
            return (await db.query('SELECT * FROM items ORDER BY id')).map(toItem);
        },
        async create(name) {
            const result = await db.execute('INSERT INTO items (name) VALUES (?)', [name]);
            const row = await db.one('SELECT * FROM items WHERE id = ?', [result.insertId]);
            if (!row) throw new Error(`Item ${result.insertId} was not saved`);
            return toItem(row);
        },
        async get(id) {
            const row = await db.one('SELECT * FROM items WHERE id = ?', [id]);
            return row ? toItem(row) : null;
        },
        async remove(id) {
            const result = await db.execute('DELETE FROM items WHERE id = ?', [id]);
            return result.affectedRows > 0;
        },
        close: () => db.close(),
    };
}

/**
 * @param {Response} res
 * @param {number} status
 * @param {unknown} body Objects are sent as JSON, strings as HTML
 * @param {Record<string, string>} [headers]
 */
function send(res, status, body, headers = {}) {
    const isJson = body !== undefined && typeof body !== 'string';
    res.writeHead(status, {
        'Content-Type': isJson ? 'application/json' : 'text/html; charset=utf-8',
        ...headers,
    });
    res.end(isJson ? JSON.stringify(body) : String(body ?? ''));
}

/**
 * @param {Request} req
 * @returns {Promise<Record<string, any>>}
 */
function readJson(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', (/** @type {Buffer} */ chunk) => (raw += chunk));
        req.on('end', () => {
            try {
                resolve(raw ? JSON.parse(raw) : {});
            } catch {
                reject(Object.assign(new Error('Invalid JSON body'), { status: 400 }));
            }
        });
        req.on('error', reject);
    });
}

/** @param {Store} store */
function createApp(store) {
    /** @type {Set<string>} */
    const tokens = new Set();

    /** @param {Request} req @param {Response} res */
    return async function handle(req, res) {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const { pathname } = url;

        try {
            if (req.method === 'GET' && PAGES[pathname]) {
                if (PROTECTED_PAGES.has(pathname) && !tokens.has(sessionToken(req))) {
                    return send(res, 302, '', { Location: `/login?next=${encodeURIComponent(pathname)}` });
                }
                return send(res, 200, fs.readFileSync(path.join(PUBLIC_DIR, PAGES[pathname]), 'utf8'));
            }

            if (req.method === 'POST' && pathname === '/api/login') {
                const { username, password } = await readJson(req);
                if (username !== DEMO_CREDENTIALS.username || password !== DEMO_CREDENTIALS.password) {
                    return send(res, 401, {
                        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' },
                    });
                }
                const token = crypto.randomUUID();
                tokens.add(token);
                return send(
                    res,
                    200,
                    { token, user: { username } },
                    { 'Set-Cookie': `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/` },
                );
            }

            if (pathname.startsWith('/api/items')) {
                if (!tokens.has(sessionToken(req))) {
                    return send(res, 401, { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
                }

                const idMatch = pathname.match(/^\/api\/items\/(\d+)$/);
                if (pathname === '/api/items' && req.method === 'GET') {
                    return send(res, 200, { items: await store.list() });
                }
                if (pathname === '/api/items' && req.method === 'POST') {
                    const { name } = await readJson(req);
                    if (typeof name !== 'string' || name.trim() === '') {
                        return send(res, 400, {
                            error: { code: 'VALIDATION_ERROR', field: 'name', message: 'Name is required' },
                        });
                    }
                    return send(res, 201, await store.create(name.trim()));
                }
                if (idMatch && req.method === 'GET') {
                    const item = await store.get(Number(idMatch[1]));
                    return item ? send(res, 200, item) : send(res, 404, { error: { code: 'NOT_FOUND' } });
                }
                if (idMatch && req.method === 'DELETE') {
                    const removed = await store.remove(Number(idMatch[1]));
                    return removed ? send(res, 204, '') : send(res, 404, { error: { code: 'NOT_FOUND' } });
                }
            }

            return send(res, 404, { error: { code: 'NOT_FOUND' } });
        } catch (caught) {
            const error = /** @type {Error & { status?: number }} */ (caught);
            return send(res, error.status || 500, { error: { code: 'SERVER_ERROR', message: error.message } });
        }
    };
}

/**
 * Starts the demo app. Port 0 picks a free port (used by parallel Cucumber workers).
 * @param {{ port?: number, host?: string }} [options]
 * @returns {Promise<{ url: string, close: () => Promise<void> }>}
 */
async function startDemoApp({ port = config.demoAppPort, host = '127.0.0.1' } = {}) {
    const store = config.db ? await createMySqlStore(config.db) : createMemoryStore();
    const server = http.createServer(createApp(store));
    await /** @type {Promise<void>} */ (
        new Promise((resolve, reject) => {
            server.once('error', reject);
            server.listen(port, host, () => resolve());
        })
    );
    const address = /** @type {import('net').AddressInfo} */ (server.address());
    return {
        url: `http://${host}:${address.port}`,
        close: async () => {
            await new Promise((resolve) => server.close(() => resolve(undefined)));
            await store.close();
        },
    };
}

module.exports = { startDemoApp };

if (require.main === module) {
    startDemoApp().then(({ url }) => console.log(`Demo app running at ${url}`));
}
