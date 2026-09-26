/**
 * Minimal leveled logger. Set LOG_LEVEL to error, warn, info or debug.
 * Framework internals log at debug so test output stays readable by default.
 */
const { config } = require('../config');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

function createLogger(scope, level = config.logLevel) {
    const threshold = LEVELS[level] ?? LEVELS.warn;
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
