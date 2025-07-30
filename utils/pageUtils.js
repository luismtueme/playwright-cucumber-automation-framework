/**
 * PageUtils - Playwright Page Interaction Utility Class
 * 
 * Provides common page interaction methods for Playwright automation.
 * Includes methods for element interactions, form handling, navigation,
 * and verification operations.
 * 
 * @author Your Name
 * @version 1.0.0
 * @since 2024
 */

const { expect } = require('@playwright/test');

/**
 * PageUtils class for Playwright page interactions
 * 
 * This class provides a comprehensive set of methods for interacting with
 * web pages using Playwright. It includes methods for form handling,
 * element interactions, navigation, and verification.
 * 
 * @example
 * const pageUtils = new PageUtils(page);
 * await pageUtils.fillTextbox('#username', 'testuser');
 * await pageUtils.clickElement('#submit-button');
 */
class PageUtils {
    /**
     * Creates a new PageUtils instance
     * 
     * @param {Object} page - Playwright page object
     */
    constructor(page) {
        this.page = page;
    }

    /**
     * Waits for an element to be visible and enabled
     * 
     * @param {string} selector - CSS selector for the element
     * @param {number} [timeout=10000] - Timeout in milliseconds
     * @throws {Error} If element is not found or not enabled within timeout
     * 
     * @example
     * await pageUtils.waitForElement('#submit-button');
     */
    async waitForElement(selector, timeout = 10000) {
        await this.page.waitForSelector(selector, { 
            state: 'visible', 
            timeout 
        });
        
        if (!(await this.page.isEnabled(selector))) {
            throw new Error(`Element ${selector} is not enabled`);
        }
    }

    /**
     * Fills a text input field with the specified value
     * 
     * @param {string} selector - CSS selector for the input field
     * @param {string} value - Value to fill in the input
     * @param {number} [timeout=10000] - Timeout in milliseconds
     * @throws {Error} If element is not found or not fillable within timeout
     * 
     * @example
     * await pageUtils.fillTextbox('#username', 'testuser');
     */
    async fillTextbox(selector, value, timeout = 10000) {
        await this.waitForElement(selector, timeout);
        await this.page.fill(selector, value);
    }

    // Handle dropdown selections
    async selectDropdown(selector, value, timeout = 10000) {
        await this.waitForElement(selector, timeout);
        
        // Try different dropdown patterns
        try {
            // Pattern 1: Standard select element
            await this.page.selectOption(selector, value);
        } catch (error) {
            try {
                // Pattern 2: Custom dropdown with button
                const dropdownButton = this.page.locator(selector).getByRole('button');
                await dropdownButton.click();
                
                const option = this.page.getByRole('option', { name: value, exact: true });
                await option.click();
            } catch (secondError) {
                // Pattern 3: Direct click on option
                const option = this.page.locator(`${selector} option[value="${value}"]`);
                await option.click();
            }
        }
    }

    // Handle checkbox interactions
    async handleCheckbox(selector, shouldCheck = true, timeout = 10000) {
        await this.waitForElement(selector, timeout);
        
        if (shouldCheck) {
            await this.page.check(selector);
        } else {
            await this.page.uncheck(selector);
        }
    }

    // Handle radio button selection
    async selectRadioButton(selector, timeout = 10000) {
        await this.waitForElement(selector, timeout);
        await this.page.check(selector);
    }

    // Handle file uploads
    async uploadFile(fileInputSelector, filePath, timeout = 10000) {
        await this.waitForElement(fileInputSelector, timeout);
        await this.page.setInputFiles(fileInputSelector, filePath);
        console.log(`File uploaded successfully: ${filePath}`);
    }

    // Click elements
    async clickElement(selector, timeout = 10000) {
        await this.waitForElement(selector, timeout);
        await this.page.click(selector);
    }

    // Get text content
    async getText(selector, timeout = 10000) {
        await this.waitForElement(selector, timeout);
        return await this.page.textContent(selector);
    }

    // Verify element is visible
    async verifyElementVisible(selector, timeout = 10000) {
        await this.waitForElement(selector, timeout);
        await expect(this.page.locator(selector)).toBeVisible();
    }

    // Verify element contains text
    async verifyElementContainsText(selector, expectedText, timeout = 10000) {
        await this.waitForElement(selector, timeout);
        await expect(this.page.locator(selector)).toContainText(expectedText);
    }

    // Wait for page to load
    async waitForPageLoad() {
        await this.page.waitForLoadState('networkidle');
    }

    // Navigate to URL
    async navigateTo(url) {
        await this.page.goto(url);
        await this.waitForPageLoad();
    }

    // Take screenshot
    async takeScreenshot(name) {
        await this.page.screenshot({ 
            path: `screenshots/${name}_${Date.now()}.png`,
            fullPage: true 
        });
    }

    // Wait for specific text to appear
    async waitForText(text, timeout = 10000) {
        await this.page.waitForFunction(
            (text) => document.body.innerText.includes(text),
            text,
            { timeout }
        );
    }

    // Scroll to element
    async scrollToElement(selector) {
        await this.page.locator(selector).scrollIntoViewIfNeeded();
    }

    // Handle alerts/dialogs
    async handleAlert(accept = true) {
        if (accept) {
            this.page.on('dialog', dialog => dialog.accept());
        } else {
            this.page.on('dialog', dialog => dialog.dismiss());
        }
    }

    // Wait for network request to complete
    async waitForRequest(urlPattern, timeout = 10000) {
        return await this.page.waitForRequest(
            request => request.url().includes(urlPattern),
            { timeout }
        );
    }

    // Wait for response
    async waitForResponse(urlPattern, timeout = 10000) {
        return await this.page.waitForResponse(
            response => response.url().includes(urlPattern),
            { timeout }
        );
    }

    // Get element attribute
    async getAttribute(selector, attribute, timeout = 10000) {
        await this.waitForElement(selector, timeout);
        return await this.page.getAttribute(selector, attribute);
    }

    // Check if element exists
    async elementExists(selector, timeout = 5000) {
        try {
            await this.page.waitForSelector(selector, { timeout });
            return true;
        } catch {
            return false;
        }
    }

    // Clear input field
    async clearInput(selector, timeout = 10000) {
        await this.waitForElement(selector, timeout);
        await this.page.fill(selector, '');
    }

    // Type text with delay (for human-like interaction)
    async typeText(selector, text, delay = 100, timeout = 10000) {
        await this.waitForElement(selector, timeout);
        await this.page.fill(selector, '');
        await this.page.type(selector, text, { delay });
    }
}

module.exports = PageUtils; 