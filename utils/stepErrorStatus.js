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
    /** @param {Error & { matcherResult?: unknown }} original */
    constructor(original) {
        super(original.message);
        this.name = 'AssertionError';
        this.stack = original.stack;
        this.matcherResult = original.matcherResult;
    }
}

/**
 * @template {(...args: any[]) => any} F
 * @param {F} fn Step or hook function
 * @returns {F}
 */
function wrapStepFunction(fn) {
    /** @this {unknown} @param {...unknown} args */
    const wrapped = async function (...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            if (error instanceof Error && 'matcherResult' in error) {
                throw new AssertionError(error);
            }
            throw error;
        }
    };
    // Cucumber uses the function's arity to validate step parameters
    Object.defineProperty(wrapped, 'length', { value: fn.length });
    return /** @type {F} */ (/** @type {unknown} */ (wrapped));
}

module.exports = { AssertionError, wrapStepFunction };
