/**
 * Report Generation Utility
 * 
 * This script generates HTML reports from Cucumber JSON output files.
 * It processes test results and creates formatted HTML reports for viewing.
 * 
 * @author Your Name
 * @version 1.0.0
 * @since 2024
 */

const reporter = require('cucumber-html-reporter');

/**
 * Configuration options for HTML report generation
 * 
 * @type {Object}
 */
const options = {
    theme: 'bootstrap',
    jsonFile: './cucumber-report/cucumber_report.json',
    output: './cucumber-report/cucumber_report.html',
    reportSuiteAsScenarios: true,
    launchReport: true,
    metadata: {
        "App Version": "1.0.0",
        "Test Environment": "STAGING",
        "Browser": "Chrome 91.0.4472.124",
        "Platform": "Windows 10",
        "Parallel": "Scenarios",
        "Executed": "Remote"
    },
    storeScreenshots: true,
    screenshotsDirectory: './screenshots/',
    reportFailedUrl: true,
};

reporter.generate(options);
