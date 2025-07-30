/**
 * DbUtils - Database Utility Class
 * 
 * Provides database operations for MySQL databases including connection management,
 * query execution, and data validation. Supports parameterized queries and file-based queries.
 * 
 * @author Your Name
 * @version 1.0.0
 * @since 2024
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

/**
 * DbUtils class for handling MySQL database operations
 * 
 * This class provides methods for connecting to MySQL databases, executing queries,
 * and managing database operations. It supports both direct queries and file-based queries.
 * 
 * @example
 * const config = {
 *   host: 'localhost',
 *   user: 'username',
 *   password: 'password',
 *   database: 'testdb',
 *   port: 3306
 * };
 * const dbUtils = new DbUtils(config);
 * const result = await dbUtils.runQuery('SELECT * FROM users WHERE id = ?', [1]);
 */
class DbUtils {
    /**
     * Creates a new DbUtils instance
     * 
     * @param {Object} config - Database configuration object
     * @param {string} config.host - Database host
     * @param {string} config.user - Database username
     * @param {string} config.password - Database password
     * @param {string} config.database - Database name
     * @param {number} [config.port=3306] - Database port
     */
    constructor(config) {
        this.config = config;
    }

    /**
     * Creates a database connection
     * 
     * @returns {Promise<Object>} MySQL connection object
     * @throws {Error} If connection fails
     * 
     * @example
     * const connection = await dbUtils.createConnection();
     */
    async createConnection() {
        return mysql.createConnection({
            host: this.config.host,
            user: this.config.user,
            password: this.config.password,
            database: this.config.database,
            port: this.config.port || 3306
        });
    }

    /**
     * Executes a SQL query with parameters
     * 
     * @param {string} query - SQL query string
     * @param {Array} [params=[]] - Query parameters
     * @returns {Promise<Array>} Query results
     * @throws {Error} If query execution fails
     * 
     * @example
     * const results = await dbUtils.runQuery('SELECT * FROM users WHERE status = ?', ['active']);
     */
    async runQuery(query, params = []) {
        const connection = await this.createConnection();
        try {
            const [results] = await connection.execute(query, params);
            return results;
        } finally {
            await connection.end();
        }
    }

    async runQueryFromFile(fileName, params = []) {
        const sqlPath = path.resolve(__dirname, '../sql', fileName);
        const query = fs.readFileSync(sqlPath, 'utf8');
        return await this.runQuery(query, params);
    }

    async saveResultsToArray(query, params = []) {
        const results = await this.runQuery(query, params);
        return results.map(row => Object.values(row));
    }

    // Generic method to verify database values
    async verifyValues(query, params, expectedValues) {
        const dbResults = await this.runQuery(query, params);

        if (dbResults.length === 0) {
            console.error('No records found in the database for the given criteria');
            return false;
        }

        const dbRecord = dbResults[0];

        // Compare expected values with actual database values
        for (const [key, expectedValue] of Object.entries(expectedValues)) {
            const actualValue = dbRecord[key];
            
            if (expectedValue !== actualValue) {
                console.error(`Mismatch for ${key}: Expected = ${expectedValue}, Actual = ${actualValue}`);
                return false;
            }
        }

        console.log('All values match successfully.');
        return true;
    }

    // Generic method to check if a record exists
    async recordExists(query, params = []) {
        const results = await this.runQuery(query, params);
        return results.length > 0;
    }

    // Generic method to get a single record
    async getRecord(query, params = []) {
        const results = await this.runQuery(query, params);
        return results.length > 0 ? results[0] : null;
    }

    // Generic method to get multiple records
    async getRecords(query, params = []) {
        return await this.runQuery(query, params);
    }

    // Generic method to count records
    async countRecords(query, params = []) {
        const results = await this.runQuery(query, params);
        return results[0]['COUNT(*)'] || 0;
    }
}

module.exports = DbUtils;
