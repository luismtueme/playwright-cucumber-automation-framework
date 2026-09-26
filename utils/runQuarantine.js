/**
 * Runs only @quarantine tests in both runners, always both, and exits non-zero if
 * either failed. CI runs this without blocking merges; results still reach Allure.
 *
 * Quarantine a flaky test by tagging it @quarantine plus a ticket (@jira:ABC-123 in
 * Gherkin, or the ticket in the test title), then fix it and remove the tag.
 *
 * Usage: npm run test:quarantine
 */
const { spawnSync } = require('child_process');

const env = { ...process.env, QUARANTINE: 'true' };
const run = (/** @type {string} */ command) => spawnSync(command, { stdio: 'inherit', shell: true, env }).status ?? 1;

const playwright = run('npx playwright test --pass-with-no-tests');
const cucumber = run('npx cucumber-js');
process.exit(playwright || cucumber);
