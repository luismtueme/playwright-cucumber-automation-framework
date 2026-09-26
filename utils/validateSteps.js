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
        // Validate every feature, including tag-filtered ones like @db
        provided: { dryRun: true, format: [], tags: '', parallel: 0, retry: 0 },
    });

    /** @type {string[]} */
    const problems = [];
    /** @type {Map<string, import('@cucumber/messages').Pickle>} */
    const pickles = new Map();
    /** @type {Map<string, import('@cucumber/messages').TestCase>} */
    const testCases = new Map();
    /** @type {Map<string, string>} */
    const testCaseStarts = new Map();

    await runCucumber(runConfiguration, undefined, (message) => {
        const finished = message.testStepFinished;
        if (message.pickle) {
            pickles.set(message.pickle.id, message.pickle);
        } else if (message.testCase) {
            testCases.set(message.testCase.id, message.testCase);
        } else if (message.testCaseStarted) {
            testCaseStarts.set(message.testCaseStarted.id, message.testCaseStarted.testCaseId);
        } else if (finished) {
            const { status } = finished.testStepResult;
            if (status !== 'UNDEFINED' && status !== 'AMBIGUOUS') return;

            const testCase = testCases.get(testCaseStarts.get(finished.testCaseStartedId) ?? '');
            const pickle = testCase && pickles.get(testCase.pickleId);
            const testStep = testCase?.testSteps.find((step) => step.id === finished.testStepId);
            const pickleStep = pickle?.steps.find((step) => step.id === testStep?.pickleStepId);
            problems.push(
                `${status.toLowerCase()}: "${pickleStep?.text}" (${pickle?.uri}, scenario "${pickle?.name}")`,
            );
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
