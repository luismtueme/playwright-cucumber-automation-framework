/**
 * JsonUtils - JSON Processing Utility
 * 
 * Provides utilities for JSON comparison, parsing, and manipulation.
 * Includes methods for comparing JSON objects and handling JSON data.
 * 
 * @author Your Name
 * @version 1.0.0
 * @since 2024
 */

const fs = require('fs');

/**
 * Compares two JSON objects and returns differences
 * 
 * This function compares an expected JSON (loaded from file) with an actual JSON object
 * and returns an array of differences found. Useful for API response validation.
 * 
 * @param {string} expectedJsonPath - Path to the expected JSON file
 * @param {Object} actualJson - Actual JSON object to compare
 * @returns {Array|null} Array of differences or null if no differences found
 * 
 * @example
 * const differences = compareJson('expected-response.json', apiResponse);
 * if (differences) {
 *   console.log('Differences found:', differences);
 * }
 */
function compareJson(expectedJsonPath, actualJson) {
    const expectedJson = JSON.parse(fs.readFileSync(expectedJsonPath, 'utf8'));
    const differences = [];

    /**
     * Recursively compares two objects and builds a list of differences
     * 
     * @param {Object} expected - Expected object
     * @param {Object} actual - Actual object
     * @param {string} [path=''] - Current path in the object structure
     * @returns {void}
     */
    function compareObjects(expected, actual, path = '') {
        for (const key in expected) {
            if (expected.hasOwnProperty(key)) {
                const currentPath = path ? `${path}.${key}` : key;
                if (actual.hasOwnProperty(key)) {
                    if (typeof expected[key] === 'object' && expected[key] !== null) {
                        compareObjects(expected[key], actual[key], currentPath);
                    } else if (expected[key] !== actual[key]) {
                        differences.push({ path: currentPath, expected: expected[key], actual: actual[key] });
                    }
                } else {
                    differences.push({ path: currentPath, expected: expected[key], actual: undefined });
                }
            }
        }
    }

    compareObjects(expectedJson, actualJson);

    return differences.length ? differences : null;
}

module.exports = {
    compareJson,
    parse: JSON.parse,
    stringify: JSON.stringify
};
