const path = require('path');
const { pathToFileURL } = require('url');
const config = require('../config/testConfig.json');

/**
 * Resolves the application URL used by the tests.
 *
 * Priority: BASE_URL environment variable, then config/testConfig.json "url".
 * Values without a protocol are treated as paths relative to the project root
 * and converted to file:// URLs (used by the bundled example fixture).
 *
 * @returns {string} Absolute URL to open in the browser
 */
function getAppUrl() {
    const url = process.env.BASE_URL || config.url;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
        return url;
    }
    return pathToFileURL(path.resolve(__dirname, '..', url)).href;
}

module.exports = { getAppUrl };
