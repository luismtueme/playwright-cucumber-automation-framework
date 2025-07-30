const { Before, After,AfterAll,BeforeAll, setDefaultTimeout } = require('@cucumber/cucumber');
const fs = require('fs');
const path = require('path');
const config = require('../config/testConfig.json')
require('../utils/world');

setDefaultTimeout(60000); // Set default timeout to 60 seconds

BeforeAll(() => {
    const allureResultsPath = path.resolve(process.cwd(), "allure-results");

    // Ensure allure-results directory exists
    try {
        fs.mkdirSync(allureResultsPath, { recursive: true });
        console.log("Ensured allure-results directory exists.");
    } catch (error) {
        console.error("Error ensuring allure-results directory:", error.message);
        throw error;
    }

    // Create Environment Data in the report
    try {
        const environmentData = `
        OS=${process.platform}
        Browser=${config.browserType}
        NodeVersion=${process.version}
        URL=${config.url}
        `;
        fs.writeFileSync(
            path.join(allureResultsPath, "environment.properties"),
            environmentData
        );
        console.log("Environment properties file written.");
    } catch (error) {
        console.error("Error writing environment.properties file:", error.message);
        throw error;
    }

    // Add Categories in the report
    try {
        const categoriesPath = path.resolve(__dirname, "../config/categories.json");
        const destinationPath = path.join(allureResultsPath, "categories.json");
        const categories = fs.readFileSync(categoriesPath, "utf-8");
        fs.writeFileSync(destinationPath, categories);
        console.log("Categories file loaded and written to allure-results.");
    } catch (error) {
        console.error("Error loading categories:", error.message);
        throw error;
    }

    // Add Executor Information
    try {
        const executorPath = path.join(allureResultsPath, "executor.json");
        const isGithubActions = process.env.GITHUB_ACTIONS === "true";

        const executorData = isGithubActions
            ? {
                name: "GitHub Actions",
                type: "CI/CD",
                url: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions`,
                buildName: `GitHub Actions Build #${process.env.GITHUB_RUN_NUMBER}`,
                buildUrl: process.env.GITHUB_RUN_URL,
                reportUrl: `https://${process.env.GITHUB_REPOSITORY_OWNER}.github.io/${process.env.GITHUB_REPOSITORY}/allure-report/`,
                infrastructure: "GitHub Actions",
                environment: process.env.TEST_ENV || "QA",
            }
            : {
                name: "Local Execution",
                type: "Local",
                url: "http://localhost:3000",
                buildName: "Local Execution",
                buildUrl: "http://localhost:3000",
                reportUrl: "http://localhost:3000/allure-report",
                infrastructure: "Local Machine",
                environment: process.env.TEST_ENV || "Local",
            };

        fs.writeFileSync(executorPath, JSON.stringify(executorData, null, 2));
        console.log(
            `Executor information written to allure-results: ${
                isGithubActions ? "GitHub Actions" : "Local Execution"
            }`
        );
    } catch (error) {
        console.error("Error writing executor information:", error.message);
        throw error;
    }
});



Before(async function (scenario) {
    try {

        const tags = scenario.pickle.tags.map(tag => tag.name);
        if (!tags.includes('@api')) {
            console.log("Initializing browser...");
            const browserType = config.browserType;
            
            // Force headless mode in CI environments
            const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
            const headlessMode = isCI ? true : config.headless;
            
            await this.init(browserType, {
                headless: headlessMode,
                args: ['--start-maximized'],
                recordVideo: {
                    dir: 'videos/',
                    size: { width: 1920, height: 1080 },
                },
            });

        await this.context.tracing.start({ screenshots: true, snapshots: true });
        console.log("Browser and context initialized successfully.");
        this.page.setDefaultTimeout(30000);

        } else {
            console.log("Skipping browser initialization for non-web scenario.");
        }
    } catch (error) {
        console.error("Error during browser initialization in Before hook:", error);
        throw error;
    }
});

After(async function (scenario) {
    console.log('After hook triggered for scenario:', scenario.pickle.name);

    try {
        // Capture screenshot if the scenario fails
        if (scenario.result.status === 'FAILED' && this.page) {
            const screenshot = await this.page.screenshot();
            await this.attach(screenshot, 'image/png');
        }

        // Attach video if the scenario fails
        if (scenario.result.status === 'FAILED' && this.page && this.page.video) {
            const videoPath = await this.page.video().path();
            const video = fs.readFileSync(videoPath);
            await this.attach(video, 'video/webm');
        }

        // Save trace for failed scenarios
        if (scenario.result.status === 'FAILED' && this.context) {
            const tracePath = `./traces/${scenario.pickle.name.replace(/\s+/g, '_')}.zip`;
            await this.context.tracing.stop({ path: tracePath });
            console.log(`Trace saved for failed scenario: ${tracePath}`);

            // Attach the trace to Allure
            const traceFile = fs.readFileSync(tracePath);
            await this.attach(traceFile, 'application/zip', `${scenario.pickle.name.replace(/\s+/g, '_')}.zip`);
        } else if (this.context) {
            await this.context.tracing.stop(); // Stop tracing without saving for passed tests
        }
    } catch (error) {
        console.error('Error capturing attachments:', error);
    }

    if (this.browser) {
        console.log('Closing browser...');
        await this.close();
        console.log('Browser closed successfully.');
    }

});

AfterAll(() => {
    console.log('All test completed');
})