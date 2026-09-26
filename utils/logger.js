/**
 * Minimal leveled logger. Set LOG_LEVEL to error, warn, info or debug.
 * Framework internals log at debug so test output stays readable by default.
 */
const { config } = require('../config');

/** @typedef {'error' | 'warn' | 'info' | 'debug'} Level */
/** @typedef {(message: string, ...details: unknown[]) => void} LogFn */

/** @type {Record<Level, number>} */
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

/**
 * @param {string} scope Shown in every line, e.g. "[INFO] [api] ..."
 * @param {string} [level] Defaults to LOG_LEVEL
 * @returns {Record<Level, LogFn>}
 */
function createLogger(scope, level = config.logLevel) {
    const threshold = LEVELS[/** @type {Level} */ (level)] ?? LEVELS.warn;
    /**
     * @param {Level} name
     * @param {'error' | 'warn' | 'log'} method
     * @returns {LogFn}
     */
    const write =
        (name, method) =>
        (message, ...details) => {
            if (LEVELS[name] <= threshold) {
                console[method](`[${name.toUpperCase()}] [${scope}] ${message}`, ...details);
            }
        };
    return {
        error: write('error', 'error'),
        warn: write('warn', 'warn'),
        info: write('info', 'log'),
        debug: write('debug', 'log'),
    };
}

module.exports = { createLogger, LEVELS };
