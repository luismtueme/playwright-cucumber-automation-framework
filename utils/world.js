const { setWorldConstructor, World } = require('@cucumber/cucumber');
const { chromium, firefox, webkit } = require('@playwright/test');

class CustomWorld extends World {
    constructor(options) {
        super(options);
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async init(browserType = 'chromium', options = {}) {
        try {
            console.log(`Launching browser: ${browserType}`);
            
            // Detect CI environment and force headless mode
            const isCI = process.env.CI || process.env.GITHUB_ACTIONS;
            const defaultHeadless = isCI ? true : false;
            
            const browserLaunchOptions = {
                headless: options.headless !== undefined ? options.headless : defaultHeadless,
                args: options.args || [],
            };
            this.browser = await { chromium, firefox, webkit }[browserType].launch(browserLaunchOptions);
            console.log("Browser launched successfully.");
            this.context = await this.browser.newContext({
                viewport: null,
                recordVideo: options.recordVideo || null,
            });
            console.log(`Browser context created with video recording: ${options.recordVideo ? 'enabled' : 'disabled'}`);
            console.log("Browser context created successfully.");
            this.page = await this.context.newPage();
            console.log("New page created successfully.");

            // Dynamically set the screen size based on the browser's screen dimensions
            const screenSize = await this.page.evaluate(() => ({
                // width: window.screen.width,
                // height: window.screen.height,
                width: 1536,
                height: 960,
            }));
            await this.page.setViewportSize(screenSize);
            console.log(`Viewport size set to: width=${screenSize.width}, height=${screenSize.height}`);
        } catch (error) {
            console.error("Error during browser initialization:", error);
            throw error;
        }
    }

    async close() {
        try {
            if (this.page) {
                console.log("Closing page...");
                await this.page.close();
            }
            if (this.context) {
                console.log("Closing context...");
                await this.context.close();
            }
            if (this.browser) {
                console.log("Closing browser...");
                await this.browser.close();
            }
        } catch (error) {
            console.error("Error during browser closure:", error);
        }
    }
}

setWorldConstructor(CustomWorld);

module.exports = CustomWorld;
