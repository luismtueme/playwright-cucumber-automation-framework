/**
 * Single source of test configuration for both runners (Playwright Test and Cucumber).
 *
 * Precedence: environment variables > .env file > config/testConfig.json defaults.
 * Secrets (credentials, tokens, DB passwords) come only from the environment, never
 * from committed files. See .env.example for every supported variable.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
/** @type {readonly BrowserName[]} */
const BROWSERS = ['chromium', 'firefox', 'webkit'];
/** @type {readonly ArtifactMode[]} */
const ARTIFACT_MODES = ['off', 'on', 'retain-on-failure'];

// Demo app credentials are public on purpose: they only unlock the bundled demo app
const DEMO_CREDENTIALS = { username: 'demo', password: 'demo-password' };

function loadEnvFile(file = path.join(ROOT, '.env')) {
    if (fs.existsSync(file)) {
        process.loadEnvFile(file);
    }
}

/**
 * @typedef {'chromium' | 'firefox' | 'webkit'} BrowserName
 * @typedef {'off' | 'on' | 'retain-on-failure'} ArtifactMode
 * @typedef {{ host: string, port: number, user?: string, password?: string, database?: string }} DbConfig
 *
 * @typedef {object} Defaults Shape of config/testConfig.json
 * @property {string} baseUrl
 * @property {string} environment
 * @property {BrowserName} browser
 * @property {boolean} headless
 * @property {{ width: number, height: number }} viewport
 * @property {{ action: number, navigation: number, expect: number, test: number }} timeouts
 * @property {ArtifactMode} video
 * @property {ArtifactMode} trace
 *
 * @typedef {Readonly<ReturnType<typeof buildConfig>>} Config
 */

/**
 * @param {string} name
 * @param {string | undefined} value
 * @param {boolean} fallback
 */
function parseBoolean(name, value, fallback) {
    if (value === undefined || value === '') return fallback;
    if (/^(1|true|yes)$/i.test(value)) return true;
    if (/^(0|false|no)$/i.test(value)) return false;
    throw new Error(`${name} must be true or false, got "${value}"`);
}

/**
 * @param {string} name
 * @param {string | undefined} value
 * @param {number} fallback
 */
function parseInteger(name, value, fallback) {
    if (value === undefined || value === '') return fallback;
    const number = Number(value);
    if (!Number.isInteger(number) || number < 0) {
        throw new Error(`${name} must be a non-negative integer, got "${value}"`);
    }
    return number;
}

/**
 * @template {string} T
 * @param {string} name
 * @param {string} value
 * @param {readonly T[]} allowed
 * @returns {T}
 */
function oneOf(name, value, allowed) {
    if (!allowed.includes(/** @type {T} */ (value))) {
        throw new Error(`${name} must be one of ${allowed.join(', ')}, got "${value}"`);
    }
    return /** @type {T} */ (value);
}

/**
 * Builds the configuration object from defaults and an environment.
 * Exported separately from the cached config so it can be unit tested.
 *
 * @param {Record<string, string | undefined>} env
 * @param {Defaults} defaults Contents of config/testConfig.json
 */
function buildConfig(env, defaults) {
    const isCI = parseBoolean('CI', env.CI, false);
    const baseUrl = (env.BASE_URL || defaults.baseUrl || '').replace(/\/+$/, '');
    const useDemoApp = baseUrl === '';

    const username = env.APP_USERNAME || (useDemoApp ? DEMO_CREDENTIALS.username : undefined);
    const password = env.APP_PASSWORD || (useDemoApp ? DEMO_CREDENTIALS.password : undefined);

    return Object.freeze({
        isCI,
        environment: env.TEST_ENV || defaults.environment,
        useDemoApp,
        baseUrl,
        demoAppPort: parseInteger('DEMO_APP_PORT', env.DEMO_APP_PORT, 4173),
        apiBaseUrl: (env.API_BASE_URL || baseUrl).replace(/\/+$/, ''),
        browser: oneOf('TEST_BROWSER', env.TEST_BROWSER || defaults.browser, BROWSERS),
        headless: parseBoolean('HEADLESS', env.HEADLESS, isCI ? true : defaults.headless),
        viewport: Object.freeze({ ...defaults.viewport }),
        timeouts: Object.freeze({
            action: parseInteger('ACTION_TIMEOUT', env.ACTION_TIMEOUT, defaults.timeouts.action),
            navigation: parseInteger('NAVIGATION_TIMEOUT', env.NAVIGATION_TIMEOUT, defaults.timeouts.navigation),
            expect: parseInteger('EXPECT_TIMEOUT', env.EXPECT_TIMEOUT, defaults.timeouts.expect),
            test: parseInteger('TEST_TIMEOUT', env.TEST_TIMEOUT, defaults.timeouts.test),
        }),
        retries: parseInteger('RETRIES', env.RETRIES, isCI ? 1 : 0),
        workers: parseInteger('WORKERS', env.WORKERS, isCI ? 2 : 4),
        video: oneOf('VIDEO', env.VIDEO || defaults.video, ARTIFACT_MODES),
        trace: oneOf('TRACE', env.TRACE || defaults.trace, ARTIFACT_MODES),
        credentials: Object.freeze({ username, password }),
        db: env.DB_HOST
            ? Object.freeze({
                  host: env.DB_HOST,
                  port: parseInteger('DB_PORT', env.DB_PORT, 3306),
                  user: env.DB_USER,
                  password: env.DB_PASSWORD,
                  database: env.DB_NAME,
              })
            : null,
        jiraBaseUrl: (env.JIRA_BASE_URL || '').replace(/\/+$/, ''),
        logLevel: env.LOG_LEVEL || (isCI ? 'info' : 'warn'),
        // Run only @quarantine tests (flaky tests that report but don't block merges)
        quarantine: parseBoolean('QUARANTINE', env.QUARANTINE, false),
        // Run only visual tests; they must run in Docker (npm run test:visual) for stable pixels
        visual: parseBoolean('VISUAL', env.VISUAL, false),
        inDocker: parseBoolean('IN_DOCKER', env.IN_DOCKER, false),
    });
}

/**
 * Returns credentials for the application under test, or throws with setup instructions.
 * @param {{ credentials: { username?: string, password?: string } }} config
 */
function requireCredentials(config) {
    const { username, password } = config.credentials;
    if (!username || !password) {
        throw new Error('APP_USERNAME and APP_PASSWORD must be set for this app. Copy .env.example to .env.');
    }
    return { username, password };
}

loadEnvFile();
/** @type {Defaults} */
const defaults = JSON.parse(fs.readFileSync(path.join(__dirname, 'testConfig.json'), 'utf8'));
const config = buildConfig(process.env, defaults);

module.exports = { config, buildConfig, requireCredentials, DEMO_CREDENTIALS, ROOT };
