const fs = require('fs');
const path = require('path');

module.exports = async () => {

    const allureResultsPath = path.resolve(__dirname, '../allure-results');
    const historyPath = path.join(allureResultsPath, 'history');
    console.log('Cleaning allure-results folder while retaining history...');

    if (fs.existsSync(allureResultsPath)) {
        fs.readdirSync(allureResultsPath)
            .forEach(file => {
                const filePath = path.join(allureResultsPath, file);
                if (file !== 'history') {
                    fs.rmSync(filePath, { recursive: true, force: true });
                }
            });

        // Ensure the history folder exists after cleanup
        fs.mkdirSync(historyPath, { recursive: true });
    }

    // Create environment.properties file
    const environmentPath = path.join(allureResultsPath, 'environment.properties');
    const environmentDetails = `
  Browser=${process.env.BROWSER}
  OS=${process.platform}
  App Version=1.3.2.0
  Test Environment=QA
  Execution Time=${new Date().toLocaleString()}
  `;
    fs.mkdirSync(path.dirname(environmentPath), { recursive: true });
    fs.writeFileSync(environmentPath, environmentDetails.trim());
    console.log('Environment properties file created.');

    // Create categories.json file
    createCategoriesFile();

    // Create executor.json file
    createExecutorFile();
};

function createCategoriesFile() {
    const categories = require('./allureCategories');

    const allureResultsPath = path.resolve(__dirname, '../allure-results');
    const categoriesPath = path.join(allureResultsPath, 'categories.json');

    fs.mkdirSync(allureResultsPath, { recursive: true });
    fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
    console.log('categories.json file created.');
}

function createExecutorFile() {
    const executor = {
        name: "GitHub Actions",
        type: "CI",
        url: process.env.GITHUB_SERVER_URL || "https://github.com",
        buildName: process.env.GITHUB_WORKFLOW || "Unknown Workflow",
        buildUrl: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
        reportName: "Allure Report for GitHub Actions",
        environment: "QA",
        browser: process.env.BROWSER || "Chrome",
        os: process.platform,
        triggeredBy: process.env.GITHUB_ACTOR || "Unknown User"
    };

    const allureResultsPath = path.resolve(__dirname, '../allure-results');
    const executorPath = path.join(allureResultsPath, 'executor.json');

    fs.mkdirSync(allureResultsPath, { recursive: true }); // Ensure allure-results exists
    fs.writeFileSync(executorPath, JSON.stringify(executor, null, 2));
    console.log('executor.json file created.');
}
