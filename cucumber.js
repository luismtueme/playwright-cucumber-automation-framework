/**
 * Cucumber Configuration File
 * 
 * This file configures Cucumber.js test runner settings including feature file paths,
 * step definition locations, reporting options, and execution parameters.
 * 
 * @author Your Name
 * @version 1.0.0
 * @since 2024
 */

module.exports = {
    default: {
        paths: ["features/**/*.feature"],
        require: ["step_definitions/**/*.js", "hooks/hooks.js"],
        format: [
            "allure-cucumberjs/reporter"
        ],
        formatOptions: {
            snippetInterface: "async-await",
            links: {
                jira: {
                    pattern: [/^@jira:(.*)$/],
                    urlTemplate: (value) => {
                        const ticket = value.replace("@jira:", "");
                        return `https://yourcompany.atlassian.net/browse/${ticket}`;
                    },
                },
            },
        },
        retry: 0
    },
};
