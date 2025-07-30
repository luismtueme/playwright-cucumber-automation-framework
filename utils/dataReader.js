/**
 * DataReader - Data File Reading Utility
 * 
 * Provides methods for reading and parsing various data file formats including JSON, CSV,
 * and other common data formats used in test automation.
 * 
 * @author Your Name
 * @version 1.0.0
 * @since 2024
 */

const fs = require('fs');

/**
 * DataReader utility class for reading and parsing data files
 * 
 * This class provides methods for reading various data file formats including JSON, CSV,
 * and other common data formats used in test automation. It includes error handling
 * and validation for file operations.
 * 
 * @example
 * const testData = DataReader.readJson('test-data/user-data.json');
 */
class DataReader {
    /**
     * Reads and parses a JSON file
     * 
     * @param {string} filePath - Path to the JSON file
     * @returns {Object} Parsed JSON data
     * @throws {Error} If file cannot be read or parsed
     * 
     * @example
     * const userData = DataReader.readJson('test-data/users.json');
     */
    static readJson(filePath) {
        try {
            const rawData = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(rawData);
        } catch (error) {
            throw new Error(`Failed to read JSON file ${filePath}: ${error.message}`);
        }
    }
}

module.exports = DataReader;