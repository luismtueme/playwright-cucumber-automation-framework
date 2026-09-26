# Playwright-Cucumber Automation Framework

A robust automation framework built with Playwright and Cucumber for web application testing.

## 🚀 Features

- **Playwright Integration**: Modern browser automation with Playwright
- **Cucumber BDD**: Behavior-driven development with Gherkin syntax
- **Page Object Model**: Maintainable and reusable page objects
- **Multiple Browser Support**: Chrome, Firefox, Safari
- **API Testing**: Built-in API testing capabilities
- **Database Integration**: MySQL database support
- **Test Reporting**: Allure and Cucumber HTML reports
- **TestRail Integration**: Optional TestRail integration
- **Configuration Management**: Environment-specific configurations

## 📁 Project Structure

```
├── config/                 # Configuration files
│   ├── testConfig.json    # Main test configuration
│   ├── categories.json    # Test categories and environments
│   └── expectedApiResponse.json # API response templates
├── features/              # Cucumber feature files
│   └── example.feature    # Example feature file
├── step_definitions/      # Cucumber step definitions
│   └── exampleSteps.js    # Example step definitions
├── pages/                 # Page Object Model files
│   └── examplePage.js     # Example page object
├── tests/                 # Playwright test specs
│   └── example.spec.js    # Example test spec
├── test-data/             # Test data files
│   └── example-data.json  # Example test data
├── utils/                 # Utility functions
│   ├── apiUtils.js        # API utility functions
│   ├── pageUtils.js       # Page interaction utilities
│   ├── dataReader.js      # Data reading utilities
│   ├── dbUtils.js         # Database utilities
│   ├── jsonUtils.js       # JSON utilities
│   ├── logger.js          # Logging utilities
│   ├── testRailIntegration.js # TestRail integration
│   └── world.js           # Cucumber world configuration
├── hooks/                 # Cucumber hooks
│   └── hooks.js           # Test hooks
├── playwright.config.js   # Playwright configuration
├── cucumber.js            # Cucumber configuration
└── package.json           # Project dependencies
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd playwright-cucumber-framework
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npx playwright install
   ```

### 🚀 **GitHub Actions (Optional)**
This framework includes a pre-configured GitHub Actions workflow for CI/CD:
- ✅ Required PR checks: dependency audit, step-definition validation, and the full test suite (a failing test fails the PR)
- ✅ Allure report generation and deployment to GitHub Pages from `main` (no personal access token needed)
- ✅ Dependabot updates for npm packages and GitHub Actions
- 📖 See `.github/GITHUB_ACTIONS_GUIDE.md` for detailed setup instructions

## ⚙️ Configuration

### 1. Update Test Configuration

Edit `config/testConfig.json` with your application details:

```json
{
  "browserType": "chromium",
  "headless": false,
  "url": "https://your-application.com",
  "username": "your-username",
  "password": "your-password"
}
```

Out of the box, `url` points to `test-fixtures/example-app.html`, a local page the example tests run against. Paths without a protocol are opened as local files. You can also override the URL per run with the `BASE_URL` environment variable.

### 2. Environment Setup

Configure different environments in `config/categories.json`:

```json
{
  "environments": {
    "dev": {
      "url": "https://dev.yourapp.com"
    },
    "qa": {
      "url": "https://qa.yourapp.com"
    }
  }
}
```

## 🧪 Running Tests

### Run Cucumber Tests
```bash
npm run test:cucumber
```

### Run Cucumber Tests with Allure Reporting
```bash
npx cucumber-js --format allure-cucumberjs/reporter
```

### Run Playwright Tests
```bash
npm run test:playwright
```

### Run All Tests
```bash
npm test
```

### Validate Without Running (same as the CI `Checks` job)
```bash
npm run check
```
Fails on undefined or ambiguous Cucumber steps and on Playwright specs that can't be loaded.

### Run Specific Feature
```bash
npx cucumber-js features/example.feature
```

### Run with Tags
```bash
npx cucumber-js --tags @Smoke
```

### Run in Specific Browser
```bash
npx playwright test --project=chromium
```

## 📝 Writing Tests

### 1. Feature Files (Gherkin)

Create feature files in the `features/` directory:

```gherkin
Feature: User Login
  As a user
  I want to log in to the application
  So that I can access my account

  Scenario: Successful login
    Given I navigate to the login page
    When I enter valid credentials
    And I click the login button
    Then I should be redirected to the dashboard
```

### 2. Step Definitions

Create step definitions in `step_definitions/`:

```javascript
const { Given, When, Then } = require('@cucumber/cucumber');

Given('I navigate to the login page', async function() {
    await this.page.goto(this.config.url + '/login');
});

When('I enter valid credentials', async function() {
    await this.page.fill('#username', this.config.username);
    await this.page.fill('#password', this.config.password);
});
```

### 3. Page Objects

Create page objects in `pages/`:

```javascript
class LoginPage {
    constructor(page) {
        this.page = page;
        this.usernameField = '#username';
        this.passwordField = '#password';
        this.loginButton = '#login-button';
    }

    async login(username, password) {
        await this.page.fill(this.usernameField, username);
        await this.page.fill(this.passwordField, password);
        await this.page.click(this.loginButton);
    }
}

module.exports = LoginPage;
```

## 🔧 Utilities

### API Testing
Use `utils/apiUtils.js` for API testing:

```javascript
const ApiUtils = require('../utils/apiUtils');
const config = require('../config/testConfig.json');

const apiUtils = new ApiUtils(config.apiConfig);

// Make API calls
const response = await apiUtils.get('/api/users');
const postResponse = await apiUtils.post('/api/users', { name: 'John' });
```

### Database Operations
Use `utils/dbUtils.js` for database operations:

```javascript
const DbUtils = require('../utils/dbUtils');
const config = require('../config/testConfig.json');

const dbUtils = new DbUtils(config.dbConfig);

// Execute queries
const result = await dbUtils.runQuery('SELECT * FROM users');
const user = await dbUtils.getRecord('SELECT * FROM users WHERE id = ?', [1]);
```

### Page Interactions
Use `utils/pageUtils.js` for common web interactions:

```javascript
const PageUtils = require('../utils/pageUtils');

const pageUtils = new PageUtils(page);

// Common interactions
await pageUtils.fillTextbox('#username', 'testuser');
await pageUtils.selectDropdown('#country', 'USA');
await pageUtils.clickElement('#submit-button');
```

### Data Reading
Use `utils/dataReader.js` for reading test data:

```javascript
const DataReader = require('../utils/dataReader');

// Read test data
const testData = DataReader.readJson('test-data/example-data.json');
```

## 📊 Reporting

### Allure Reports
Both suites write to `allure-results/`. For Cucumber scenarios the report shows each Gherkin step with its status, the failing step's error and line number, and a screenshot and Playwright trace for failed scenarios (under the scenario's "Tear down" section). Assertion failures show as **failed** and test-code errors as **broken**, grouped by the categories in `utils/allureCategories.js`.


Generate and view Allure reports:

1. **Install Allure Command Line Tool** (if not already installed):
```bash
npm install -g allure-commandline
```

2. **Generate Allure Report**:
```bash
allure generate allure-results --clean --output allure-report
```

3. **Open Allure Report**:
```bash
allure open allure-report
```

**Alternative: Generate and open in one command**:
```bash
allure serve allure-results
```

## 🔗 TestRail Integration

Configure TestRail integration in `config/testConfig.json`:

```json
{
  "enableTestRail": true,
  "testRail": {
    "host": "https://yourcompany.testrail.com",
    "username": "your-username",
    "apiKey": "your-api-key",
    "projectId": 1
  }
}
```

## 🐳 Docker Support

Create a `Dockerfile` for containerized testing:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.48.1

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["npm", "run", "test:cucumber"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review example files

## 🔄 Updates

Keep your framework updated:
```bash
npm update
npx playwright install
```

**Note**: This is a template framework. Replace example files and configurations with your actual application-specific implementations. 