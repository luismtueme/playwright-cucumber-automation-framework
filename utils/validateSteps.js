/**
 * Step Definition Validator
 *
 * Runs Cucumber in dry-run mode (no browser, no step code executed) and fails
 * if any step is undefined or matches more than one step definition.
 * Cucumber's own --dry-run exits 0 in these cases, so CI uses this instead.
 *
 * Usage: node utils/validateSteps.js
 */

const { loadConfiguration, runCucumber } = require('@cucumber/cucumber/api');

async function main() {
    const { runConfiguration } = await loadConfiguration({
        provided: { dryRun: true, format: [] },
    });

    const problems = [];
    const pickles = new Map();
    const testCases = new Map();
    const testCaseStarts = new Map();

    await runCucumber(runConfiguration, undefined, (message) => {
        if (message.pickle) {
            pickles.set(message.pickle.id, message.pickle);
        } else if (message.testCase) {
            testCases.set(message.testCase.id, message.testCase);
        } else if (message.testCaseStarted) {
            testCaseStarts.set(message.testCaseStarted.id, message.testCaseStarted.testCaseId);
        } else if (message.testStepFinished) {
            const { status } = message.testStepFinished.testStepResult;
            if (status !== 'UNDEFINED' && status !== 'AMBIGUOUS') return;

            const testCase = testCases.get(testCaseStarts.get(message.testStepFinished.testCaseStartedId));
            const pickle = pickles.get(testCase.pickleId);
            const testStep = testCase.testSteps.find((step) => step.id === message.testStepFinished.testStepId);
            const pickleStep = pickle.steps.find((step) => step.id === testStep.pickleStepId);
            problems.push(`${status.toLowerCase()}: "${pickleStep.text}" (${pickle.uri}, scenario "${pickle.name}")`);
        }
    });

    if (problems.length > 0) {
        console.error(`Step validation failed with ${problems.length} problem(s):`);
        problems.forEach((problem) => console.error(`  - ${problem}`));
        process.exit(1);
    }
    console.log(`Step validation passed: ${pickles.size} scenario(s), all steps defined exactly once.`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
