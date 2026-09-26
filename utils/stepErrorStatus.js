const { setDefinitionFunctionWrapper } = require('@cucumber/cucumber');

/**
 * Makes Playwright assertion failures show as "failed" (not "broken") in Allure.
 *
 * Playwright's expect() throws an ExpectError. Cucumber only passes the error's
 * class name, message and stack on to Allure, and Allure only treats errors
 * whose name contains "assert" as test failures. Everything else is reported
 * as "broken" (a problem with the test itself). This wrapper re-throws
 * Playwright assertion errors as AssertionError, keeping message and stack.
 */
class AssertionError extends Error {
    constructor(original) {
        super(original.message);
        this.name = 'AssertionError';
        this.stack = original.stack;
        this.matcherResult = original.matcherResult;
    }
}

setDefinitionFunctionWrapper((fn) => {
    const wrapped = async function (...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            if (error && typeof error === 'object' && 'matcherResult' in error) {
                throw new AssertionError(error);
            }
            throw error;
        }
    };
    // Cucumber uses the function's arity to validate step parameters
    Object.defineProperty(wrapped, 'length', { value: fn.length });
    return wrapped;
});

module.exports = { AssertionError };
