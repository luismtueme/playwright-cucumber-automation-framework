# Run guide

A step-by-step guide for people who are new to this framework: how to set it up, run it, add your own tests and point it at your own application. For the feature overview and reference tables, see the [README](../README.md).

Every command in this guide was run against this repository. Commands use Bash syntax; the [Windows notes](#windows-notes) show the PowerShell equivalents.

## Contents

1. [Set up](#1-set-up)
2. [Use](#2-use)
3. [Create tests](#3-create-tests)
4. [Point it at your own app](#4-point-it-at-your-own-app)
5. [Troubleshooting](#5-troubleshooting)
6. [Command cheat sheet](#6-command-cheat-sheet)

## 1. Set up

### Prerequisites

| Tool | Version | Needed for |
|---|---|---|
| [Node.js](https://nodejs.org) | 22.8 or newer | Everything |
| Git | any recent | Cloning the repo |
| Java | 8 or newer, on `PATH` | Only `npm run report` (the Allure command line runs on Java) |
| [Docker](https://www.docker.com) | any recent | Only visual tests, the Docker Compose run, and a local MySQL for `@db` scenarios |

Check what you have:

```bash
node --version   # v22.8.0 or newer
java -version    # only for reports
docker --version # optional
```

### Install

The steps are the same on Windows, macOS and Linux:

```bash
git clone https://github.com/luismtueme/playwright-cucumber-automation-framework.git
cd playwright-cucumber-automation-framework
npm install
npx playwright install chromium
```

`npx playwright install chromium` downloads the browser Playwright drives. Add `firefox` or `webkit` when you want those too (`npx playwright install firefox webkit`). On Linux, if the browser fails to start because of missing system libraries, run `npx playwright install --with-deps chromium` instead; it installs them with your package manager.

Settings are optional for the demo app. To change any of them, copy the example file and edit it:

```bash
cp .env.example .env
```

### First run

```bash
npm test
```

This cleans old results, starts the demo app, runs the Playwright specs (in `tests/`) and then the Cucumber scenarios (in `features/`). A fresh clone ends with all specs and all scenarios passing. If it doesn't, see [Troubleshooting](#5-troubleshooting).

The browser is visible on local runs (`headless` is `false` in `config/testConfig.json`) and hidden in CI. To hide it locally, set `HEADLESS=true`.

### Docker instead of a local setup

If you'd rather not install Node.js and browsers, Docker runs everything, a MySQL database included:

```bash
docker compose run --build --rm tests
docker compose down -v   # afterwards: stop MySQL and delete its data
```

Use `--build` every time: without it, Compose reuses the image from the last build and runs your old code. Results are written back to `allure-results/`, `html-report/`, `traces/` and `videos/` on your machine. Any npm script works in place of the default: `docker compose run --build --rm tests npm run check`.

### IDE setup

The repo doesn't commit editor settings (`.vscode/` is git-ignored), so set these up once. In VS Code, install:

| Extension | Why |
|---|---|
| Playwright Test for VS Code (`ms-playwright.playwright`) | Run and debug specs from the editor, pick locators, record new tests |
| Cucumber (`CucumberOpen.cucumber-official`) | Gherkin highlighting, autocomplete of step text, go to step definition |
| ESLint (`dbaeumer.vscode-eslint`) | Shows lint errors as you type |
| Prettier (`esbenp.prettier-vscode`) | Formats on save with the repo's `.prettierrc.json` |

Tell the Cucumber extension where the features and steps are, in your user or workspace `settings.json`:

```json
{
    "cucumber.features": ["features/**/*.feature"],
    "cucumber.glue": ["step_definitions/**/*.js"]
}
```

The JavaScript is type-checked through JSDoc comments, so VS Code shows autocomplete and type errors for `this` in step definitions and for fixtures in specs with no extra setup.

## 2. Use

### Run everything

```bash
npm test                 # clean results, Playwright specs, then Cucumber scenarios
npm run test:playwright  # only the Playwright specs
npm run test:cucumber    # only the Cucumber scenarios
```

### Run by tag

Cucumber tags are on features and scenarios. The allowed tags are `@Smoke`, `@Regression`, `@ui`, `@api`, `@db`, `@authenticated`, `@a11y`, `@quarantine` and `@jira:ABC-123` (listed in `utils/lintGherkin.js`):

```bash
npx cucumber-js --tags "@Smoke"
npx cucumber-js --tags "@ui and not @authenticated"
```

Playwright specs carry tags in their titles (`'logs in @smoke'`), so you filter them with `--grep`:

```bash
npx playwright test --grep @smoke
npx playwright test --grep-invert @a11y
```

### Run one file or one test

```bash
npx playwright test tests/ui/login.spec.js        # one spec file
npx playwright test tests/ui/login.spec.js:11     # the test at line 11
npx cucumber-js --name "Log in with valid credentials"   # scenarios whose name matches
```

For Cucumber, filter by tag or by `--name` rather than by file. `cucumber.js` already lists `features/**/*.feature`, and Cucumber-JS 13 adds a file you pass on the command line to that list instead of replacing it, so `npx cucumber-js features/ui/login.feature` still runs every scenario (it prints a deprecation note saying so).

### Watch and debug

```bash
npx playwright test --headed            # show the browser (it's already shown locally unless HEADLESS=true)
npx playwright test --ui                # UI mode: pick tests, watch them run, time-travel through each step
npx playwright test --debug tests/ui/login.spec.js   # step through with the Playwright Inspector
HEADLESS=false WORKERS=1 npx cucumber-js --tags "@Smoke"   # Cucumber, one scenario at a time, browser visible
```

When a test fails, open its trace to see every action, the DOM before and after it, network calls and console logs:

```bash
npx playwright show-trace traces/<scenario-name>.zip               # Cucumber traces
npx playwright show-trace test-results/<test-folder>/trace.zip     # Playwright traces
```

### Other browsers

```bash
npx playwright install firefox webkit   # once
TEST_BROWSER=firefox npm test
TEST_BROWSER=webkit npx cucumber-js --tags "@Smoke"
```

`TEST_BROWSER` applies to both runners. Any other value fails at startup: `TEST_BROWSER must be one of chromium, firefox, webkit, got "edge"`.

### Reports

| Report | Where | Open it with |
|---|---|---|
| Allure (both runners together) | `allure-results/` | `npm run report` (needs Java) |
| Playwright HTML | `html-report/` | `npx playwright show-report html-report` |
| Traces and videos of failures | `traces/`, `videos/`, `test-results/` | `npx playwright show-trace <file>.zip` |

`npm run report` builds `allure-report/` and starts a local server to show it; stop it with Ctrl+C. Run `npm test` (or `npm run clean`) before a new run so old results don't mix in; running one suite on its own keeps the other suite's results.

### Database scenarios (`@db`)

`@db` scenarios check what the API wrote directly in MySQL. They're skipped unless `DB_HOST` is set. To run them on your machine, start a throwaway MySQL in Docker:

```bash
docker run -d --name test-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=testdb -e MYSQL_USER=tester -e MYSQL_PASSWORD=tester mysql:8.4
```

Wait a few seconds for it to start, then:

```bash
export DB_HOST=127.0.0.1 DB_USER=tester DB_PASSWORD=tester DB_NAME=testdb
npx cucumber-js --tags @db
node utils/checkLeftoverData.js   # fails if any test left rows behind
docker rm -f test-mysql           # when you're done
```

With `DB_HOST` set, the demo app stores items in MySQL too (table `items`, created on first start), so every scenario runs against the real database. If port 3306 is already in use, map another one (`-p 3307:3306`) and set `DB_PORT=3307`.

### Quarantined tests

Tests tagged `@quarantine` are left out of the normal run. Run only them with:

```bash
npm run test:quarantine
```

It runs both runners, always both, and fails if either has a failing test.

### CI

`.github/workflows/playwright.yml` runs on every pull request and every push to `main`:

| Job | What it does | Blocks merging |
|---|---|---|
| Checks | `npm run lint`, `npm run typecheck`, `npm audit --audit-level=high`, `npm run test:unit`, `npm run check`. No browser, about a minute | Yes |
| Tests | Both suites on Chromium against the demo app, with a MySQL service so `@db` scenarios run. Then `npm run test:quarantine` (allowed to fail) and `node utils/checkLeftoverData.js` | Yes |
| Visual | `npm run test:visual` in the Playwright Docker image; uploads expected/actual/diff images when screenshots differ | Yes |
| Publish Allure Report | On pushes to `main` only: builds the Allure report with trend history and publishes it to GitHub Pages | No |

`.github/workflows/nightly.yml` runs both suites on Chromium, Firefox and WebKit every day at 06:00 UTC, and on demand from the Actions tab. For a pull request, download the `allure-results` and `test-artifacts` artifacts from the run's summary page to see what failed.

## 3. Create tests

This section walks through adding tests for a new page, end to end, then an API test, a database check, and quarantining a test. The example is a contact page with a message box and a Send button. The demo app doesn't have one, so step 0 adds it; with your own app, skip step 0.

### Step 0 (demo app only): add the page

Create `demo-app/public/contact.html`:

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>Contact | Example Application</title>
    </head>
    <body>
        <main>
            <h1>Contact us</h1>
            <form id="contact-form" novalidate>
                <label for="contact-message">Message</label>
                <textarea id="contact-message" name="message"></textarea>
                <button type="submit">Send</button>
            </form>
            <p id="contact-status" role="status"></p>
        </main>

        <script>
            document.getElementById('contact-form').addEventListener('submit', (event) => {
                event.preventDefault();
                const message = document.getElementById('contact-message').value.trim();
                document.getElementById('contact-status').textContent = message
                    ? 'Thanks, we will get back to you'
                    : 'Please enter a message';
            });
        </script>
    </body>
</html>
```

Then serve it: in `demo-app/server.js`, add the route to `PAGES`:

```javascript
const PAGES = { '/': 'index.html', '/login': 'login.html', '/items': 'items.html', '/contact': 'contact.html' };
```

### Step 1: the page object

Create `pages/ContactPage.js`. A page object holds the page's locators and the actions a user takes on it, and no assertions:

```javascript
const { BasePage } = require('./BasePage');

/** Demo app contact page ("/contact"). */
class ContactPage extends BasePage {
    static path = '/contact';

    /** @param {import('@playwright/test').Page} page */
    constructor(page) {
        super(page);
        this.heading = page.getByRole('heading', { name: 'Contact us' });
        this.message = page.getByLabel('Message');
        this.sendButton = page.getByRole('button', { name: 'Send' });
        this.status = page.getByRole('status');
    }

    /** @param {string} text */
    async send(text) {
        await this.message.fill(text);
        await this.sendButton.click();
    }
}

module.exports = { ContactPage };
```

- `static path` is where `open()` (from `BasePage`) navigates, relative to the base URL.
- Prefer `getByRole` and `getByLabel`: they find elements the way a user and a screen reader do, and survive markup changes. Use `getByTestId` only when there's no accessible name.
- Never add waits: Playwright waits for each element before acting on it, and lint rejects `waitForTimeout` and `networkidle`.

### Step 2: make it available to both runners

For Cucumber, add a getter to the World in `utils/world.js`, next to the others:

```javascript
const { ContactPage } = require('../pages/ContactPage');
```

```javascript
    get contactPage() {
        return this.pageObject(ContactPage);
    }
```

For Playwright specs, add a fixture in `tests/fixtures.js`: the `require`, a line in the `Fixtures` typedef (so specs get autocomplete), and the fixture itself:

```javascript
const { ContactPage } = require('../pages/ContactPage');
```

```javascript
 * @property {InstanceType<typeof ContactPage>} contactPage
```

```javascript
        contactPage: async ({ page }, use) => {
            await use(new ContactPage(page));
        },
```

### Step 3: the feature

Create `features/ui/contact.feature`:

```gherkin
@ui @Regression
Feature: Contact page
  Visitors can send a message from the contact page.

  Background:
    Given I am on the contact page

  @Smoke
  Scenario: Send a message
    When I send the message "The manhole cover on Elm St is loose"
    Then the contact status is "Thanks, we will get back to you"

  Scenario: An empty message is rejected
    When I send the message ""
    Then the contact status is "Please enter a message"
```

Rules the Gherkin lint (`npm run lint`) checks: only allowed tags, a `Then` in every scenario, unique scenario names in a feature, and an Examples column for every `<placeholder>` in an outline. `@ui` (or no `@api` tag) gives the scenario a browser; it starts logged out unless you add `@authenticated`.

### Step 4: the steps

Before writing steps, check whether they already exist: `npm run check` lists every step that has no definition. Here all three are new. Create `step_definitions/contact.steps.js`:

```javascript
const { Given, When, Then } = require('../utils/steps');
const { expect } = require('@playwright/test');

Given('I am on the contact page', async function () {
    await this.contactPage.open();
    await expect(this.contactPage.heading).toBeVisible();
});

When('I send the message {string}', async function (text) {
    await this.contactPage.send(text);
});

Then('the contact status is {string}', async function (status) {
    await expect(this.contactPage.status).toHaveText(status);
});
```

- Import `Given`/`When`/`Then` from `utils/steps.js`, not from `@cucumber/cucumber`, so `this` is typed as the World and `npm run typecheck` catches typos like `this.contactPgae`.
- Assertions go in `Then` steps, with Playwright's `expect`. `toHaveText` and `toBeVisible` retry until they pass or time out, so they work for text that appears after a click or an API call.
- `{string}` matches a quoted value, `{int}` a whole number, `{word}` one word. Cucumber passes them to the function in order.

### Step 5: the same tests as a Playwright spec (optional)

If you also want the checks as a spec, create `tests/ui/contact.spec.js`:

```javascript
const { test, expect, LOGGED_OUT } = require('../fixtures');

test.describe('Contact page', () => {
    test.use({ storageState: LOGGED_OUT });

    test('sends a message @smoke', async ({ contactPage }) => {
        await contactPage.open();
        await contactPage.send('The manhole cover on Elm St is loose');
        await expect(contactPage.status).toHaveText('Thanks, we will get back to you');
    });

    test('rejects an empty message', async ({ contactPage }) => {
        await contactPage.open();
        await contactPage.send('');
        await expect(contactPage.status).toHaveText('Please enter a message');
    });
});
```

Import `test` and `expect` from `tests/fixtures.js`, not from `@playwright/test`, to get the fixtures. Specs start logged in by default; `test.use({ storageState: LOGGED_OUT })` makes these tests run as a visitor.

### Step 6: run it

```bash
npx cucumber-js --name "Send a message|An empty message is rejected"
npx playwright test tests/ui/contact.spec.js
npm run lint && npm run typecheck && npm run check
```

All three commands should pass. If a step shows as undefined, its text in the feature and in the step definition differ; `npm run check` shows which.

### Step 7: add the page to the accessibility checks

Every page gets an axe-core check against WCAG 2.1 A and AA. Add three lines:

1. In `features/ui/accessibility.feature`, a row under "Public pages" (or under "Pages that need a login" for pages behind a login):
   ```gherkin
       Examples: Public pages
         | page    |
         | form    |
         | login   |
         | contact |
   ```
2. In `step_definitions/accessibility.steps.js`, the page's name in `PAGES`, so `Given I open the contact page` works:
   ```javascript
       contact: (/** @type {World} */ world) => world.contactPage,
   ```
3. In `tests/ui/accessibility.spec.js`, a test (inside the "logged out" block for public pages):
   ```javascript
           test('contact page @a11y', async ({ contactPage, checkAccessibility }) => {
               await contactPage.open();
               await checkAccessibility();
           });
   ```

Then run `npx cucumber-js --tags @a11y` and `npx playwright test --grep @a11y`. A violation fails with the rule, the failing elements and a link explaining the fix. If something you don't control fails (a third-party widget), call `checkAccessibility({ exclude: ['#widget'] })` in the spec, and say why in a comment.

### Step 8: clean up test data

The contact page doesn't save anything, so these tests have nothing to clean up. A test that creates data must delete it, pass or fail; CI fails the run if rows are left behind. The tools:

| Where | Use |
|---|---|
| Spec | `createItem({ name })` creates an item through the API and deletes it after the test |
| Spec | `trackItem(item)` deletes an item you created another way (for example through the UI) |
| Step | `this.cleanUpItem(item)` deletes an item after the scenario |
| Step | `this.addCleanup(async () => { ... })` runs any cleanup after the scenario |

For example, `step_definitions/items.steps.js` registers the cleanup in the same step that creates the item:

```javascript
When('I add an item named {string} on the items page', async function (name) {
    const item = await this.itemsPage.addItem(name);
    if (!item) throw new Error(`The app rejected "${name}"`);
    this.createdItem = { id: item.id, name: item.name };
    this.cleanUpItem(item);
});
```

When your app has a new kind of data, write a cleanup like `cleanUpItem` in `utils/world.js` and a factory like `createItem` in `tests/fixtures.js`, and add the table to `TABLES` in `utils/checkLeftoverData.js`.

### An API test

API scenarios are tagged `@api`: they don't open a browser. Existing steps cover most requests, so a new scenario often needs no new code. This one checks that the API trims item names; add it to `features/api/items.feature`:

```gherkin
  Scenario: Item names are trimmed
    Given I am authenticated with the API
    When I create an item named "  Lateral 9 inspection  "
    Then the response status is 201
    And the response body matches:
      """json
      { "name": "Lateral 9 inspection" }
      """
```

`the response body matches:` checks only the fields you list, so ids and timestamps don't break it. `When I create an item named ...` registers the cleanup itself. Every request and response is attached to the Allure report, with passwords and tokens masked.

The same check as a spec, in `tests/api/items.spec.js`:

```javascript
    test('trims item names', async ({ createItem }) => {
        const item = await createItem({ name: '  Lateral 9 inspection  ' });
        expect(item.name).toBe('Lateral 9 inspection');
    });
```

To write a new API step, call `await this.api()` (anonymous) or `await this.authedApi()` (logged in), and store the response in `this.response` so the shared `Then the response status is ...` step can check it:

```javascript
When('I fetch the created item', async function () {
    this.response = await (await this.authedApi()).get(`/api/items/${this.lastItem.id}`);
});
```

In specs, use the `api` and `authedApi` fixtures. Each returns `{ status, body }`.

### A database check

`@db` scenarios check the database directly, after the API or UI changed it. Add this to `features/db/items-persistence.feature`, whose `Background` already logs in to the API:

```gherkin
  Scenario: A trimmed name is stored trimmed
    When I create an item named "  Lateral 9 inspection  "
    Then the database has the created item named "Lateral 9 inspection"
```

Run it with a database configured (see [Database scenarios](#database-scenarios-db)): `npx cucumber-js --tags @db`. To write your own database step, use `this.db` with parameterized queries; never build SQL from strings:

```javascript
const row = await this.db.one('SELECT id, name FROM items WHERE id = ?', [this.lastItem.id]);
const count = await this.db.count('items', 'name = ?', ['Lateral 9 inspection']);
```

### Quarantining a flaky test

A flaky test is one that sometimes fails without any change in the code. Don't retry past it:

1. Open a ticket for it.
2. Tag the scenario with `@quarantine` and the ticket:
   ```gherkin
     @quarantine @jira:QA-123
     Scenario: An empty message is rejected
   ```
   For a spec, put both in the title: `test('rejects an empty message @quarantine QA-123', ...)`.
3. It no longer runs in `npm test`. CI runs it in a separate step that can't fail the build, and its results still reach the report. Run it yourself with `npm run test:quarantine`.
4. Fix the cause, remove the tag, and close the ticket.

The Gherkin lint rejects `@quarantine` without a `@jira:` ticket: `Quarantined scenario "..." needs a @jira:ABC-123 tag`.

## 4. Point it at your own app

### Settings

Copy `.env.example` to `.env` and set the application and a test account:

```bash
BASE_URL=https://your-app.example.com
APP_USERNAME=your-test-user
APP_PASSWORD=your-test-password
```

Settings are read in this order, first match wins: environment variables, then `.env`, then `config/testConfig.json`. With `BASE_URL` set, the demo app isn't started and the demo credentials are never used. Other settings you may need:

| Variable | Use it when |
|---|---|
| `API_BASE_URL` | The API is on a different host than the web app |
| `TEST_ENV` | You want the environment name (`qa`, `staging`) in the report |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | You want `@db` checks against your database |
| `ACTION_TIMEOUT`, `NAVIGATION_TIMEOUT`, `EXPECT_TIMEOUT`, `TEST_TIMEOUT` | Your app is slower than the defaults (10s, 30s, 5s, 60s) allow |
| `WORKERS`, `RETRIES` | You want more or fewer parallel workers, or retries |
| `JIRA_BASE_URL` | You want `@jira:ABC-123` tags to link to your Jira |

`.env` is git-ignored. In CI, set the same names as repository secrets and pass them in the workflow's `env:` block (the Tests job has a commented example).

### Login and saved session

The framework logs in once and reuses the session, so most tests skip the login page. It logs in through the demo app's API in two places; change both to match your app:

| File | What to change |
|---|---|
| `tests/auth.setup.js` | For specs: the login request (`request.post('/api/login', { data: { username, password } })`). It saves the resulting cookies and local storage to `.auth/user.json` |
| `utils/authState.js` | For `@authenticated` scenarios: the same login request, in `getAuthState()` |
| `utils/apiClient.js` | `login()`, if your API uses a different endpoint or returns the token in another field |

If your app has no login API, log in through the UI instead: open the page with `LoginPage`, fill the form, then save `page.context().storageState()`.

### Page objects, features and data

1. Replace the page objects in `pages/` with your app's pages, and register each one in `utils/world.js` and `tests/fixtures.js` (see [step 2](#step-2-make-it-available-to-both-runners)).
2. Replace the examples in `features/`, `step_definitions/` and `tests/` with your own.
3. Write a factory and a cleanup for each kind of data your tests create, like `createItem` and `cleanUpItem`, and list your tables in `utils/checkLeftoverData.js`.
4. Update the page list in `features/ui/accessibility.feature`, `step_definitions/accessibility.steps.js` and `tests/ui/accessibility.spec.js`.

### Remove the demo app

Once nothing uses it:

1. Delete `demo-app/`.
2. In `hooks/hooks.js`, remove everything that uses the demo app: the `startDemoApp` require, the `let demoApp` line, the `if (config.useDemoApp)` block in `BeforeAll` and `await demoApp?.close()` in `AfterAll`. Then set `runtime.baseUrl = config.baseUrl;`.
3. In `playwright.config.js`, remove the `webServer` block.
4. In `package.json`, remove the `demo` script and the `demo-app/server.js` entry in the `test:unit` coverage list. `unit/apiClient.test.js` starts the demo app to test the client; point it at a small local server of your own, or delete the tests that need it.
5. Delete the visual baselines in `tests/visual/__screenshots__/` and record new ones with `npm run test:visual -- --update`.

Run `npm run lint`, `npm run typecheck`, `npm run test:unit` and `npm test` afterwards.

## 5. Troubleshooting

**Every test fails or times out, and the page looks wrong.** Something else is listening on port 4173, often another project's demo app. Locally, Playwright reuses whatever server is already on that port instead of starting this repo's demo app. Stop the other app, or use another port: `DEMO_APP_PORT=4300 npm test`.

**`browserType.launch: Executable doesn't exist at ...`** The browser isn't downloaded, or Playwright was updated. Run `npx playwright install chromium` (or the browser in `TEST_BROWSER`).

**`npx cucumber-js features/ui/login.feature` runs every scenario.** Cucumber-JS 13 adds command-line paths to the ones in `cucumber.js` instead of replacing them. Filter by tag (`--tags "@Smoke"`) or by scenario name (`--name "Log in"`) instead.

**A step shows as `Undefined`.** Its text in the feature doesn't match any step definition, often because of a typo or a missing quote. `npm run check` lists every undefined or ambiguous step without opening a browser.

**`@db` scenarios don't run.** They're skipped when `DB_HOST` is unset. Set the `DB_*` variables (see [Database scenarios](#database-scenarios-db)). `Database is not configured. Set DB_HOST` means a step used `this.db` in a scenario without the `@db` tag and without a database.

**`APP_USERNAME and APP_PASSWORD must be set for this app.`** `BASE_URL` points at a real application, so the demo credentials aren't used. Set both in `.env` or the environment.

**`TEST_BROWSER must be one of chromium, firefox, webkit, got "..."`** or a similar message. A setting has an invalid value; the message names the variable. Fix it in `.env` or the environment.

**`Visual tests must run in Docker for stable screenshots: npm run test:visual`.** Visual specs only run through `npm run test:visual`, which needs Docker. Fonts differ between operating systems, so baselines recorded outside Docker wouldn't match CI.

**`Unknown tag @wip. Allowed: ...`** from `npm run lint`. Use an allowed tag, or add the new one to `ALLOWED_TAGS` in `utils/lintGherkin.js` so it's documented.

**`npm run report` fails with a Java error.** The Allure command line needs Java. Install a JDK (any version from 8) and make sure `java -version` works in the same terminal.

**`docker compose run` runs old code.** Compose reused an image built before your change. Add `--build`: `docker compose run --build --rm tests`.

**`npm run lint` fails on formatting.** Run `npm run format`, which fixes Prettier and most ESLint findings, then lint again.

**A test passes alone but fails in the full run.** Usually shared data: two tests use the same item name, or one test depends on another's leftovers. Give generated data unique names (`createItem()` without a name does this) and register cleanups. Run with `WORKERS=1` to confirm it's an ordering problem.

### Windows notes

`VAR=value command` is Bash syntax. In PowerShell, set the variable first; it lasts for the terminal session:

```powershell
$env:TEST_BROWSER = "firefox"; npm test
Remove-Item Env:TEST_BROWSER   # back to the default
```

In Command Prompt, use `set TEST_BROWSER=firefox` and then `npm test`. Or put the setting in `.env`, which works the same in every shell. Git Bash on Windows accepts the Bash syntax as written in this guide.

## 6. Command cheat sheet

| Task | Command |
|---|---|
| Install | `npm install` then `npx playwright install chromium` |
| Run everything | `npm test` |
| Playwright specs only | `npm run test:playwright` |
| Cucumber scenarios only | `npm run test:cucumber` |
| Scenarios by tag | `npx cucumber-js --tags "@Smoke"` |
| Scenarios by name | `npx cucumber-js --name "Log in"` |
| Specs by tag | `npx playwright test --grep @smoke` |
| One spec file | `npx playwright test tests/ui/login.spec.js` |
| Playwright UI mode | `npx playwright test --ui` |
| Step through a spec | `npx playwright test --debug tests/ui/login.spec.js` |
| Watch Cucumber run | `HEADLESS=false WORKERS=1 npx cucumber-js --tags "@Smoke"` |
| Another browser | `TEST_BROWSER=firefox npm test` |
| `@db` scenarios | `DB_HOST=127.0.0.1 DB_USER=tester DB_PASSWORD=tester DB_NAME=testdb npx cucumber-js --tags @db` |
| Leftover data check | `node utils/checkLeftoverData.js` |
| Quarantined tests | `npm run test:quarantine` |
| Visual tests | `npm run test:visual` (`-- --update` to accept new baselines) |
| Everything in Docker | `docker compose run --build --rm tests` |
| Allure report | `npm run report` |
| Playwright HTML report | `npx playwright show-report html-report` |
| Open a trace | `npx playwright show-trace <file>.zip` |
| Lint and format check | `npm run lint` |
| Fix formatting | `npm run format` |
| Type check | `npm run typecheck` |
| Undefined steps, specs load | `npm run check` |
| Framework unit tests | `npm run test:unit` |
| Start the demo app | `npm run demo` (http://127.0.0.1:4173) |
