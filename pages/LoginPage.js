const { BasePage } = require('./BasePage');

/** Demo app login page ("/login"). */
class LoginPage extends BasePage {
    static path = '/login';

    constructor(page) {
        super(page);
        this.username = page.getByLabel('Username');
        this.password = page.getByLabel('Password');
        this.submitButton = page.getByRole('button', { name: 'Log in' });
        this.error = page.getByRole('alert');
        this.welcome = page.getByText(/^Welcome, /);
    }

    async login(username, password) {
        await this.username.fill(username);
        await this.password.fill(password);
        await this.submitButton.click();
    }
}

module.exports = { LoginPage };
