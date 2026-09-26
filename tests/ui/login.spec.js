const { test, expect } = require('../fixtures');

test.describe('Login', () => {
    test.beforeEach(async ({ loginPage }) => {
        await loginPage.open();
    });

    test('logs in with the configured credentials @smoke', async ({ loginPage, credentials }) => {
        await loginPage.login(credentials.username, credentials.password);
        await expect(loginPage.welcome).toHaveText(`Welcome, ${credentials.username}`);
    });

    test('rejects a wrong password', async ({ loginPage, credentials }) => {
        await loginPage.login(credentials.username, 'not-the-password');
        await expect(loginPage.error).toHaveText('Invalid username or password');
    });
});
