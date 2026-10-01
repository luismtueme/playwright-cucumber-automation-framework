# Changelog

All notable changes to this project. The format follows [Keep a Changelog](https://keepachangelog.com), and the project uses [semantic versioning](https://semver.org).

## [Unreleased]

### Fixed
- README: the "one feature file" command ran every scenario; it now shows filtering by name. Docker commands include `--build`, so they never run a stale image. `npm run report` notes that Allure needs Java.

### Added
- Run guide (`docs/GUIDE.md`): setup on every OS, running and debugging, a worked example that adds a page end to end (page object, feature, steps, spec, accessibility), API and database tests, quarantine, pointing the framework at your own app, troubleshooting and a command cheat sheet.

### Changed
- README: the "Which repo should I use?" table links the new Java and Selenium version, [selenium-java-cucumber-framework](https://github.com/luismtueme/selenium-java-cucumber-framework).

## [3.0.0] - 2026-09-26

### Added
- Accessibility checks with axe-core (WCAG 2.1 A/AA) on every page, in both runners: `checkAccessibility()` fixture and a "no accessibility violations" step.
- Visual comparison tests with committed baselines, run in the Playwright Docker image (`npm run test:visual`), and a `Visual` CI job.
- `@quarantine` tag for flaky tests: excluded from the normal run, run non-blocking in CI (`npm run test:quarantine`).
- Gherkin linter for this framework's conventions, part of `npm run lint`.
- `Dockerfile` and `docker-compose.yml`: the whole suite, MySQL included, in one command.
- Unit test coverage thresholds (lines 90%, branches 80%, functions 85%), `ApiClient` unit tests, version consistency tests.
- CONTRIBUTING guide and this changelog.
- Strict type checking (`npm run typecheck`) with typed fixtures and typed step definitions.
- Nightly cross-browser workflow (Chromium, Firefox, WebKit).
- Saved login sessions: Playwright `setup` project and the `@authenticated` Cucumber tag.
- Test data factories and cleanup, with a CI check for leftover rows.

### Changed
- **Breaking:** requires Node.js 22.8 or newer (coverage thresholds).
- Demo app pages use a `<main>` landmark (found by the accessibility check), and the demo app has a session cookie and a protected items page.
- `DbClient.execute()` for writes; `query()` returns rows only.

### Removed
- `cucumber-html-reporter` (the report script read a file that was never written) and `cross-env`.

## [2.0.0] - 2026-09-26

### Added
- One validated configuration for both runners (`config/index.js`); secrets from environment variables or `.env` only.
- Demo app (web + JSON API, in-memory or MySQL) so the examples pass out of the box.
- `ApiClient` on Playwright's request API, `DbClient` with a connection pool, leveled logger.
- Page objects used by every step and spec; UI, login, API and database examples in both runners.
- Parallel Cucumber runs, failure screenshot/trace/video, Allure failure categories.
- ESLint (with Playwright rules), Prettier, framework unit tests, step validation, MySQL in CI.

### Removed
- Unused utilities: `pageUtils`, `dataReader`, `jsonUtils`, `testRailIntegration`, `apiUtils`, `dbUtils`.

## [1.0.0] - 2025-07-29

- Initial Playwright + Cucumber framework template.

[Unreleased]: https://github.com/luismtueme/playwright-cucumber-automation-framework/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/luismtueme/playwright-cucumber-automation-framework/releases/tag/v3.0.0
