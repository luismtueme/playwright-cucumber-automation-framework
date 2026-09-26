# Playwright + Cucumber Automation Framework

UI, API and database test automation with [Playwright](https://playwright.dev) and [Cucumber](https://cucumber.io), reported in [Allure](https://allurereport.org).

Write tests as Gherkin scenarios (Cucumber), as Playwright specs, or both. The two runners share one configuration, the same page objects and the same API client, so a test behaves the same whichever way it's written.

[![Playwright Tests](https://github.com/luismtueme/playwright-cucumber-automation-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/luismtueme/playwright-cucumber-automation-framework/actions/workflows/playwright.yml) · [Latest Allure report](https://luismtueme.github.io/playwright-cucumber-automation-framework/allure-report/)

## What's included

| Area | How it works |
|---|---|
| UI tests | Page objects with role and label locators (`pages/`), Playwright auto-waiting, no hard-coded waits (enforced by lint) |
| API tests | `ApiClient` on Playwright's request API. In Cucumber, every request/response is attached to the report with passwords and tokens masked |
| Database checks | `DbClient` (MySQL, pooled, parameterized queries). `@db` scenarios verify what the API wrote. CI runs them against a real MySQL |
| Configuration | One config for both runners (`config/index.js`). Secrets come from environment variables or `.env`, never from committed files |
| Saved login | Log in once, reuse the session: Playwright's `setup` project, and the `@authenticated` tag in Cucumber |
| Test data | Factories and cleanup (`createItem`, `trackItem`, `this.addCleanup()`). Every test deletes what it creates, and CI fails if any rows are left behind |
| Parallel runs | Both runners run in parallel. Each Cucumber worker gets its own browser and demo app |
| Failure evidence | Screenshot, Playwright trace and video for every failed test. Videos of passing tests are deleted |
| Reporting | Allure with steps, attachments, trend history and failure categories (Application Bug, Flaky Test, Test Defect, Infrastructure) |
| Type checking | Strict TypeScript checking of the JavaScript via JSDoc. Typos in page objects, fixtures and step definitions fail before any test runs |
| Quality gates | ESLint (including Playwright rules), Prettier, type check, framework unit tests, step validation, `npm audit`, all required to merge |
| Cross-browser | Every PR runs on Chromium. A nightly job runs everything on Chromium, Firefox and WebKit |
| Demo app | `demo-app/`: a small web app and JSON API the examples run against, so everything passes out of the box |

## Quick start

Requires Node.js 20.12 or newer.

```bash
npm install
npx playwright install chromium
npm test
```

`npm test` starts the demo app automatically, runs the Playwright specs and then the Cucumber scenarios. To see the report:

```bash
npm run report
```

## Testing your own application

1. Copy `.env.example` to `.env` and set at least:
   ```bash
   BASE_URL=https://your-app.example.com
   APP_USERNAME=your-test-user
   APP_PASSWORD=your-test-password
   ```
2. Replace the page objects in `pages/` and the examples in `features/`, `step_definitions/` and `tests/` with your own.
3. Delete `demo-app/` once nothing points at it.

When `BASE_URL` is set, the demo app isn't started and the demo credentials are never used.

## Configuration

Settings are read in this order, first match wins: **environment variables**, then **`.env`**, then **`config/testConfig.json`** (non-secret defaults). Every variable is listed with a description in [`.env.example`](.env.example).

| Variable | Default | Purpose |
|---|---|---|
| `BASE_URL` | empty (demo app) | Application under test |
| `API_BASE_URL` | `BASE_URL` | API host, if different |
| `APP_USERNAME` / `APP_PASSWORD` | demo credentials for the demo app only | Login for UI and API tests |
| `TEST_BROWSER` | `chromium` | `chromium`, `firefox` or `webkit` |
| `HEADLESS` | `true` in CI | Show the browser locally with `HEADLESS=false` |
| `WORKERS` / `RETRIES` | CI: 2 / 1, local: 4 / 0 | Parallelism and retries, both runners |
| `VIDEO` / `TRACE` | `retain-on-failure` | `off`, `on` or `retain-on-failure` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | unset | Enables `@db` scenarios |
| `TEST_ENV` | `local` | Environment label in the report |
| `JIRA_BASE_URL` | unset | Turns `@jira:ABC-123` tags into report links |
| `LOG_LEVEL` | `warn` locally, `info` in CI | `error`, `warn`, `info` or `debug` |

Invalid values fail at startup with the variable name, for example `TEST_BROWSER must be one of chromium, firefox, webkit, got "ie11"`.

## Running tests

| Command | What it runs |
|---|---|
| `npm test` | Clean results, Playwright specs, then Cucumber scenarios |
| `npm run test:playwright` | Playwright specs in `tests/` |
| `npm run test:cucumber` | Cucumber scenarios in `features/` |
| `npx cucumber-js --tags "@Smoke"` | Scenarios by tag. Tags in use: `@Smoke`, `@Regression`, `@ui`, `@api`, `@db`, `@authenticated` |
| `npx playwright test --grep @smoke` | Playwright specs by tag in the title |
| `npx cucumber-js features/ui/login.feature` | One feature file |
| `npm run test:unit` | Unit tests for the framework code (`unit/`) |
| `npm run check` | Validates every Cucumber step is defined exactly once and every spec loads. No browser |
| `npm run lint` / `npm run format` | ESLint and Prettier check / auto-fix |
| `npm run typecheck` | Strict type check of all code (no build step) |
| `TEST_BROWSER=webkit npm test` | Everything in another browser |
| `npm run demo` | Starts the demo app on http://127.0.0.1:4173 |
| `npm run report` | Builds and opens the Allure report |

`@db` scenarios run only when `DB_HOST` is set. To run them locally:

```bash
docker run -d --name test-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=testdb -e MYSQL_USER=tester -e MYSQL_PASSWORD=tester mysql:8.4
DB_HOST=127.0.0.1 DB_USER=tester DB_PASSWORD=tester DB_NAME=testdb npm run test:cucumber
```

## Project structure

```
├── config/
│   ├── index.js              # Loads and validates configuration (both runners)
│   └── testConfig.json       # Non-secret defaults
├── demo-app/                 # Example app under test (delete when you adopt the framework)
├── features/                 # Gherkin: ui/, api/, db/
├── step_definitions/         # Cucumber steps, one file per area
├── hooks/hooks.js            # Cucumber lifecycle: browser, demo app, DB, failure evidence
├── pages/                    # Page objects (BasePage, FormPage, LoginPage, ItemsPage)
├── tests/
│   ├── fixtures.js           # Custom fixtures: page objects, API clients, test data factories
│   ├── auth.setup.js         # Logs in once and saves the session for browser tests
│   └── ui/, api/             # Playwright specs
├── unit/                     # Unit tests for the framework itself (node:test)
├── utils/
│   ├── apiClient.js          # HTTP client (Playwright request API)
│   ├── dbClient.js           # MySQL client
│   ├── world.js              # Cucumber World: this.page, this.formPage, this.api(), this.db
│   ├── steps.js              # Typed Given/When/Then (this = World)
│   ├── authState.js          # Saved login session for both runners
│   ├── checkLeftoverData.js  # Fails CI if tests left rows in the database
│   ├── logger.js             # Leveled logger (LOG_LEVEL)
│   ├── allureMetadata.js     # Report environment, executor and categories
│   ├── allureCategories.js   # Failure categories
│   ├── stepErrorStatus.js    # Reports assertion failures as "failed", not "broken"
│   └── validateSteps.js      # Undefined/ambiguous step check (npm run check)
├── playwright.config.js
├── cucumber.js
└── .env.example              # Every supported variable
```

## Writing tests

### A Cucumber scenario

```gherkin
@ui @Regression
Feature: Login

  Scenario: Log in with valid credentials
    Given I am on the login page
    When I log in with the configured credentials
    Then I am welcomed as the configured user
```

Steps use page objects from the World, and assertions stay in the steps. Import `Given`/`When`/`Then` from `utils/steps.js` so `this` is typed as the World (autocomplete, and typos fail `npm run typecheck`):

```javascript
const { When, Then } = require('../utils/steps');

When('I log in with the configured credentials', async function () {
    const { username, password } = requireCredentials(this.config);
    await this.loginPage.login(username, password);
});

Then('I am welcomed as the configured user', async function () {
    const { username } = requireCredentials(this.config);
    await expect(this.loginPage.welcome).toHaveText(`Welcome, ${username}`);
});
```

- `@api` scenarios don't open a browser. Use `await this.api()` (or `await this.authedApi()`) for requests and `this.db` for queries.
- `@authenticated` scenarios start logged in with a session saved once per worker, so they skip the login page.
- Anything a scenario creates must be cleaned up: call `this.cleanUpItem(item)` or `this.addCleanup(async () => ...)`. Cleanups run after the scenario, pass or fail.

### A Playwright spec

Import `test` from `tests/fixtures.js` to get page objects, API clients and test data injected. Browser tests start logged in (session saved once by `tests/auth.setup.js`):

```javascript
const { test, expect, LOGGED_OUT } = require('../fixtures');

test('lists items created through the API', async ({ itemsPage, createItem }) => {
    const item = await createItem(); // deleted automatically after the test
    await itemsPage.open(); // already logged in
    await expect(itemsPage.item(item.name)).toBeVisible();
});

test.describe('as a visitor', () => {
    test.use({ storageState: LOGGED_OUT }); // opt out of the saved session

    test('logs in', async ({ loginPage, credentials }) => {
        await loginPage.open();
        await loginPage.login(credentials.username, credentials.password);
        await expect(loginPage.welcome).toHaveText(`Welcome, ${credentials.username}`);
    });
});
```

| Fixture | Gives you |
|---|---|
| `formPage`, `loginPage`, `itemsPage` | Page objects on the test's page |
| `api` / `authedApi` | `ApiClient` without / with a login token (never carries the browser session) |
| `createItem(overrides?)` | Creates an item via the API and deletes it after the test |
| `trackItem(item)` | Deletes an item you created another way (e.g. through the UI) after the test |
| `credentials` | `{ username, password }` from the environment |

When testing your own app, update `tests/auth.setup.js` and `utils/authState.js` with your login endpoint, and write factories like `createItem` for your own data.

### A page object

```javascript
const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
    static path = '/login';

    constructor(page) {
        super(page);
        this.username = page.getByLabel('Username');
        this.password = page.getByLabel('Password');
        this.submitButton = page.getByRole('button', { name: 'Log in' });
    }

    async login(username, password) {
        await this.username.fill(username);
        await this.password.fill(password);
        await this.submitButton.click();
    }
}
```

Expose locators and user actions, and keep `expect` out of page objects so a failure points at the test that made the claim.

## Reporting

Both runners write to `allure-results/`, and `npm run report` builds one report from both.

- **Cucumber scenarios** show every Gherkin step. The failing step shows the error, expected vs received, and the line in your step definition. The screenshot, trace and video are under the scenario's "Tear down" section.
- **API steps** attach each request and response as JSON, with `password`, `token`, `authorization` and `apiKey` fields masked.
- **Status**: an assertion that doesn't hold is **failed** (probably an application bug). An error in the test itself (bad selector, timeout, script error) is **broken**.
- **Traces** open with `npx playwright show-trace <file>.zip`, or at [trace.playwright.dev](https://trace.playwright.dev).

In CI, the report for every push to `main` is published to GitHub Pages with trend history. For PRs, download the `allure-results` and `test-artifacts` artifacts from the run.

## CI

`.github/workflows/playwright.yml` runs on every PR and push to `main`:

| Job | Runs |
|---|---|
| Checks | Lint and format, type check, `npm audit` (high and critical), unit tests, step and spec validation |
| Tests | Both suites against the demo app, backed by a MySQL service container, then a check that no test data was left behind |
| Publish Allure Report | On `main` only: builds the report and deploys it to GitHub Pages |
| Nightly Cross-Browser | Daily at 06:00 UTC (and on demand): everything on Chromium, Firefox and WebKit. Not required to merge |

`main` is protected: changes need a PR with Checks and Tests passing. Dependabot opens weekly update PRs. See [.github/GITHUB_ACTIONS_GUIDE.md](.github/GITHUB_ACTIONS_GUIDE.md) for setup in your own repository.

## License

MIT. See [LICENSE](LICENSE).
