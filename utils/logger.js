/**
 * Logger - Logging Utility Class
 * 
 * Provides standardized logging functionality with different log levels.
 * Supports info, error, warning, debug, and general log messages.
 * 
 * @author Your Name
 * @version 1.0.0
 * @since 2024
 */

/**
 * Logger class for standardized logging
 * 
 * This class provides methods for logging messages at different levels
 * with consistent formatting and timestamps.
 * 
 * @example
 * Logger.info('User logged in successfully');
 * Logger.error('Failed to connect to database');
 * Logger.warn('API response time is slow');
 */
class Logger {
    /**
     * Logs a general message
     * 
     * @param {string} message - Message to log
     */
    static log(message) {
        console.log(`[LOG] ${message}`);
    }

    /**
     * Logs an informational message
     * 
     * @param {string} message - Message to log
     */
    static info(message) {
        console.log(`[INFO] ${message}`);
    }

    /**
     * Logs an error message
     * 
     * @param {string} message - Error message to log
     */
    static error(message) {
        console.error(`[ERROR] ${message}`);
    }

    /**
     * Logs a warning message
     * 
     * @param {string} message - Warning message to log
     */
    static warn(message) {
        console.warn(`[WARN] ${message}`);
    }

    /**
     * Logs a debug message
     * 
     * @param {string} message - Debug message to log
     */
    static debug(message) {
        console.log(`[DEBUG] ${message}`);
    }
}

module.exports = Logger;