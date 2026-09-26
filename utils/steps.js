/**
 * Cucumber's Given/When/Then, typed so `this` inside a step is our CustomWorld.
 * Import steps from here instead of '@cucumber/cucumber' to get autocomplete and
 * type checking for this.page, this.formPage, this.api(), ... in step definitions.
 *
 *   const { Given, When, Then } = require('../utils/steps');
 */
const cucumber = require('@cucumber/cucumber');

/**
 * @typedef {InstanceType<typeof import('./world').CustomWorld>} CustomWorld
 * @typedef {(this: CustomWorld, ...args: any[]) => any} StepFn
 * @typedef {{
 *   (pattern: string | RegExp, code: StepFn): void,
 *   (pattern: string | RegExp, options: { timeout?: number }, code: StepFn): void,
 * }} DefineStep
 */

module.exports = {
    Given: /** @type {DefineStep} */ (cucumber.Given),
    When: /** @type {DefineStep} */ (cucumber.When),
    Then: /** @type {DefineStep} */ (cucumber.Then),
};
