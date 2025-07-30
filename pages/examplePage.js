/**
 * Example Page Object
 * 
 * This is a template page object demonstrating the structure for creating
 * page objects using the Page Object Model pattern. Replace with your actual page objects.
 * 
 * @author Your Name
 * @version 1.0.0
 * @since 2024
 */

/**
 * ExamplePage class demonstrating Page Object Model structure
 * 
 * This class contains selectors and methods for interacting with a web page.
 * Replace the example selectors and methods with your actual application elements.
 * 
 * @example
 * const examplePage = new ExamplePage(page);
 * await examplePage.clickExampleButton();
 * await examplePage.fillExampleInput('test value');
 */
class ExamplePage {
    constructor(page) {
        this.page = page;
        // Example selectors - replace with your actual selectors
        this.exampleButton = '#example-button';
        this.exampleInput = '#example-input';
        this.submitButton = '#submit-button';
        this.resultElement = '#result';
        this.successMessage = '#success-message';
        this.messageElement = '#message';
    }

    async navigate(url) {
        await this.page.goto(url);
    }

    async clickExampleButton() {
        await this.page.click(this.exampleButton);
    }

    async fillExampleInput(value) {
        await this.page.fill(this.exampleInput, value);
    }

    async clickSubmitButton() {
        await this.page.click(this.submitButton);
    }

    async getResultText() {
        return await this.page.textContent(this.resultElement);
    }

    async getSuccessMessage() {
        return await this.page.textContent(this.successMessage);
    }

    async getMessageText() {
        return await this.page.textContent(this.messageElement);
    }

    async waitForElement(selector) {
        await this.page.waitForSelector(selector);
    }
}

module.exports = ExamplePage; 