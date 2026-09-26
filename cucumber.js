/**
 * Cucumber configuration. Runner settings come from config/index.js, shared with
 * playwright.config.js.
 *
 * Tags: @db scenarios run only when a database is configured (DB_HOST).
 * Add your own filter with: npx cucumber-js --tags "@Smoke"
 */
const { config } = require('./config');

const links = config.jiraBaseUrl
    ? {
          jira: {
              pattern: [/^@jira:(.*)$/],
              urlTemplate: (value) => `${config.jiraBaseUrl}/browse/${value.replace('@jira:', '')}`,
          },
      }
    : {};

module.exports = {
    default: {
        paths: ['features/**/*.feature'],
        require: ['step_definitions/**/*.js', 'hooks/hooks.js'],
        format: [
            'summary',
            // Allure writes its results to allure-results/; the stream path keeps it off stdout
            ['allure-cucumberjs/reporter', 'allure-results/.cucumber-reporter.log'],
        ],
        formatOptions: { snippetInterface: 'async-await', links },
        tags: config.db ? '' : 'not @db',
        parallel: config.workers,
        retry: config.retries,
        strict: true,
    },
};
