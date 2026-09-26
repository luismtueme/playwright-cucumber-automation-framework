const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { ApiClient } = require('../utils/apiClient');
const { startDemoApp } = require('../demo-app/server');
const { DEMO_CREDENTIALS } = require('../config');

/** @type {Awaited<ReturnType<typeof startDemoApp>>} */
let app;

before(async () => {
    app = await startDemoApp({ port: 0 });
});

after(async () => {
    await app.close();
});

test('login stores the token and sends it on later requests', async () => {
    const api = await ApiClient.create({ baseURL: app.url });
    try {
        await api.login(DEMO_CREDENTIALS.username, DEMO_CREDENTIALS.password);
        assert.equal(typeof api.token, 'string');
        const response = await api.get('/api/items');
        assert.equal(response.status, 200);
        assert.deepEqual(Object.keys(response.body), ['items']);
    } finally {
        await api.dispose();
    }
});

test('login with wrong credentials throws with the status and body', async () => {
    const api = await ApiClient.create({ baseURL: app.url });
    try {
        await assert.rejects(api.login('demo', 'wrong'), /Login failed with HTTP 401: .*INVALID_CREDENTIALS/);
        assert.equal(api.token, null);
    } finally {
        await api.dispose();
    }
});

test('post, get and delete round-trip, with JSON parsed and empty bodies as null', async () => {
    const api = await ApiClient.create({ baseURL: app.url });
    try {
        await api.login(DEMO_CREDENTIALS.username, DEMO_CREDENTIALS.password);
        const created = await api.post('/api/items', { name: 'Unit test item' });
        assert.equal(created.status, 201);
        assert.equal(created.body.name, 'Unit test item');
        assert.match(created.headers['content-type'], /application\/json/);

        const removed = await api.delete(`/api/items/${created.body.id}`);
        assert.equal(removed.status, 204);
        assert.equal(removed.body, null);
        assert.equal((await api.get(`/api/items/${created.body.id}`)).status, 404);
    } finally {
        await api.dispose();
    }
});

test('non-JSON responses come back as text', async () => {
    const api = await ApiClient.create({ baseURL: app.url });
    try {
        const page = await api.get('/login');
        assert.equal(page.status, 200);
        assert.match(page.body, /<title>Log in/);
    } finally {
        await api.dispose();
    }
});

test('onExchange receives every call with credentials masked', async () => {
    /** @type {import('../utils/apiClient').Exchange[]} */
    const exchanges = [];
    const api = await ApiClient.create({
        baseURL: app.url,
        onExchange: (exchange) => {
            exchanges.push(exchange);
        },
    });
    try {
        await api.login(DEMO_CREDENTIALS.username, DEMO_CREDENTIALS.password);
        await api.get('/api/items', { params: { page: 1 } });
    } finally {
        await api.dispose();
    }
    assert.equal(exchanges.length, 2);
    assert.deepEqual(exchanges[0].request.body, { username: 'demo', password: '***' });
    assert.equal(exchanges[0].response.body.token, '***');
    assert.equal(exchanges[1].request.headers.Authorization, '***');
    assert.deepEqual(exchanges[1].request.params, { page: 1 });
});

test('baseURL option prefixes relative paths for a context without one', async () => {
    const { request } = require('@playwright/test');
    const context = await request.newContext();
    try {
        const api = new ApiClient(context, { baseURL: app.url });
        assert.equal((await api.get('/login')).status, 200);
        await api.dispose(); // does not dispose a context it didn't create
        assert.equal((await api.get('/login')).status, 200);
    } finally {
        await context.dispose();
    }
});
