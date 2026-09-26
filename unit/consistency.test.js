/**
 * Versions that must stay in step across files. When Dependabot bumps one side,
 * these tests fail with the exact fix.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (/** @type {string} */ file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const playwrightVersion = require('@playwright/test/package.json').version;

test('Dockerfile uses the Playwright image matching @playwright/test', () => {
    const tag = read('Dockerfile').match(/FROM mcr\.microsoft\.com\/playwright:v([\d.]+)-/)?.[1];
    assert.equal(tag, playwrightVersion, `Update the Dockerfile FROM line to playwright:v${playwrightVersion}-noble`);
});

test('workflows run the Node major that package.json and @types/node target', () => {
    const typesMajor = JSON.parse(read('node_modules/@types/node/package.json')).version.split('.')[0];
    for (const workflow of ['.github/workflows/playwright.yml', '.github/workflows/nightly.yml']) {
        const text = read(workflow);
        // Either `NODE_VERSION: 22` (env) or `node-version: 22` (setup-node)
        const pinned = text.match(/NODE_VERSION: (\d+)/)?.[1] ?? text.match(/node-version: (\d+)/)?.[1];
        assert.equal(pinned, typesMajor, `${workflow} runs Node ${pinned} but @types/node is ${typesMajor}.x`);
    }
});
