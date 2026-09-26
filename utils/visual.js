/**
 * Runs the visual tests inside the official Playwright Docker image that matches
 * the installed @playwright/test version, so screenshots render the same on
 * Windows, macOS, Linux and CI.
 *
 * Usage:
 *   npm run test:visual              compare with committed baselines
 *   npm run test:visual -- --update  write new baselines (review them in the PR)
 *
 * Requires Docker. Extra arguments are passed to `playwright test`.
 */
const { spawnSync } = require('child_process');
const { ROOT } = require('../config');

const version = require('@playwright/test/package.json').version;
const image = `mcr.microsoft.com/playwright:v${version}-noble`;

const args = process.argv.slice(2).map((arg) => (arg === '--update' ? '--update-snapshots' : arg));

const docker = [
    'run',
    '--rm',
    '--ipc=host', // recommended by Playwright for Chromium in Docker
    '-v',
    `${ROOT}:/work`,
    '-w',
    '/work',
    '-e',
    'CI=true',
    '-e',
    'VISUAL=true',
    '-e',
    'IN_DOCKER=true',
    // Inside the container, hosts from your .env (BASE_URL, DB_HOST) are unreachable: use the demo app in memory
    '-e',
    'BASE_URL=',
    '-e',
    'DB_HOST=',
    image,
    'node',
    'node_modules/@playwright/test/cli.js',
    'test',
    ...args,
];

console.log(`Running visual tests in ${image}`);
const result = spawnSync('docker', docker, { stdio: 'inherit' });
if (result.error) {
    console.error(`Could not start Docker: ${result.error.message}. Visual tests need Docker installed.`);
    process.exit(1);
}
process.exit(result.status ?? 1);
