const logImpl = require('electron-log');

/**
 * Simple logger with log levels
 */
module.exports = (() => {
    // Redefine if you need it
    const CURRENT_LEVEL = 'INFO';

    const LEVELS = {
        ERROR: 1,
        WARN: 2,
        INFO: 3,
        DEBUG: 4,
    };

    /**
     * Pretty-print javascript error
     */
    const errorToString = (error) => `${error.toString()}\nStack trace:\n${error.stack}`;

    /**
     * Prints log message
     */
    const print = (level, method, args) => {
        // check log level
        if (LEVELS[CURRENT_LEVEL] < LEVELS[level]) {
            return;
        }
        if (!args || args.length === 0 || !args[0]) {
            return;
        }

        const str = `${args[0]}`;
        args = Array.prototype.slice.call(args, 1);
        const formatted = str.replace(/{(\d+)}/g, (match, number) => {
            if (typeof args[number] !== 'undefined') {
                let value = args[number];
                if (value instanceof Error) {
                    value = errorToString(value);
                } else if (value && value.message) {
                    value = value.message;
                } else if (typeof value === 'object') {
                    value = JSON.stringify(value);
                }
                return value;
            }

            return match;
        });

        logImpl[method](formatted);
    };

    /**
     * Finds the path to log file
     *
     * @return {string}
     */
    const findLogPath = () => {
        return logImpl.transports.file.findLogPath();
    };

    /**
     * Expose public API
     */
    return {
        debug() {
            print('DEBUG', 'log', arguments);
        },

        info() {
            print('INFO', 'info', arguments);
        },

        warn() {
            print('WARN', 'info', arguments);
        },

        error() {
            print('ERROR', 'error', arguments);
        },
        findLogPath,
    };
})();
