const js = require('@eslint/js');
const globals = require('globals');
const playwright = require('eslint-plugin-playwright');
const prettier = require('eslint-config-prettier');

module.exports = [
    {
        ignores: ['node_modules/', 'allure-results/', 'allure-report/', 'html-report/', 'test-results/', '_site/'],
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'commonjs',
            globals: { ...globals.node },
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            eqeqeq: ['error', 'always'],
            'no-var': 'error',
            'prefer-const': 'error',
        },
    },
    {
        files: ['demo-app/public/**/*.js'],
        languageOptions: { globals: { ...globals.browser } },
    },
    {
        // Playwright best-practice rules for specs (no hard waits, no focused tests, awaited expects)
        ...playwright.configs['flat/recommended'],
        files: ['tests/**/*.js'],
        // auth.setup.js names its test function `setup`
        settings: { playwright: { globalAliases: { test: ['setup'] } } },
        rules: {
            ...playwright.configs['flat/recommended'].rules,
            'playwright/no-wait-for-timeout': 'error',
        },
    },
    {
        // Cucumber steps also use Playwright's expect and page API
        files: ['step_definitions/**/*.js', 'pages/**/*.js'],
        plugins: { playwright },
        rules: {
            'playwright/missing-playwright-await': 'error',
            'playwright/no-wait-for-timeout': 'error',
            'playwright/no-force-option': 'warn',
            'playwright/prefer-web-first-assertions': 'error',
            'playwright/no-networkidle': 'error',
        },
    },
    prettier,
];
