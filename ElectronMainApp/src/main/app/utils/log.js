const logImpl = require('electron-log');

/**
 * Simple logger with log levels
 */
module.exports = (() => {

    // Force set app name for log file
    logImpl.transports.file.appName = 'AdGuardForSafari';

    // Redefine if you need it
    const CURRENT_LEVEL = "INFO";

    const LEVELS = {
        ERROR: 1,
        WARN: 2,
        INFO: 3,
        DEBUG: 4
    };

    /**
     * Pretty-print javascript error
     */
    const errorToString = error => error.toString() + "\nStack trace:\n" + error.stack;

    /**
     * Prints log message
     */
    const print = (level, method, args) => {
        //check log level
        if (LEVELS[CURRENT_LEVEL] < LEVELS[level]) {
            return;
        }
        if (!args || args.length === 0 || !args[0]) {
            return;
        }

        const str = args[0] + "";
        args = Array.prototype.slice.call(args, 1);
        let formatted = str.replace(/{(\d+)}/g, (match, number) => {
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
     * Expose public API
     */
    return {
        debug: function () {
            print("DEBUG", "log", arguments);
        },

        info: function () {
            print("INFO", "info", arguments);
        },

        warn: function () {
            print("WARN", "info", arguments);
        },

        error: function () {
            print("ERROR", "error", arguments);
        }
    };
})();