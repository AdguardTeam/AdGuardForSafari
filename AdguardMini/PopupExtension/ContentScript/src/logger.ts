/**
 * @file Logger implementation.
 *
 * Provides basic logging functionality with deferred logging.
 * Messages are buffered until the logger is initialized.
 * Once initialized, depending on the specified logging level,
 * buffered messages will either be flushed to the console or discarded.
 */

import { type Logger, LoggingLevel as SafariLoggingLevel } from '@adguard/safari-extension';

/* eslint-disable @typescript-eslint/no-explicit-any */

type LoggingLevel = 'log' | 'discard';

// currentLevel holds the active logging level.
// It remains null until the logger is explicitly initialized.
let currentLevel: LoggingLevel | null = null;

// logPrefix holds the configurable prefix for all log messages.
let logPrefix = '';

// pendingLogs stores log messages that are buffered until the logger is
// initialized. Each pending log is stored as an array so that it can be
// re-spread into `console.log`.
let pendingLogs: any[][] = [];

/**
 * Logs messages with an ISO 8601 timestamp and a configurable prefix.
 *
 * This function accepts a variable number of parameters to mirror the interface
 * of `console.log`.
 *
 * Behavior:
 * - If the logger is not yet initialized (currentLevel is null), the log entry
 *   is buffered.
 * - If the logger is initialized with the 'log' level, the message is
 *   immediately output to the console with the configured prefix.
 * - If the logger is initialized with the 'discard' level, the log entry is
 *   ignored.
 *
 * @param args - The log message and additional parameters.
 */
function log(...args: any[]): void {
    const timestamp = `[${new Date().toISOString()}]`;
    if (currentLevel === null) {
        // Buffer the message until the logger is initialized.
        pendingLogs.push([timestamp, ...args]);
    } else if (currentLevel === 'log') {
        // Output the timestamp, prefix, and the log message.
        // eslint-disable-next-line no-console
        console.log(timestamp, logPrefix, ...args);
    }
    // If currentLevel is 'discard', the log entry is ignored.
}

/**
 * Logger adapter for Safari Extension API.
 */
const loggerAdapter: Logger = {
    level: SafariLoggingLevel.Debug,
    error: (message: string) => {
        log(message);
    },
    debug: (message: string) => {
        log(message);
    },
    info: (message: string) => {
        log(message);
    },
};

/**
 * Initializes the logger by setting the logging behavior and the message
 * prefix.
 *
 * After initialization, future log messages behave according to the specified
 * logging level:
 *
 * - 'log': Future messages are immediately output to the console with the
 *          configured prefix, and any buffered messages are flushed.
 * - 'discard': Both buffered and future log messages are dropped.
 *
 * @param level - The logging level to set:
 *   - 'log' to output log messages.
 *   - 'discard' to ignore log messages.
 * @param prefix - The configurable prefix to be added to every log message.
 */
function initLogger(level: LoggingLevel, prefix: string): void {
    logPrefix = prefix;
    currentLevel = level;
    if (currentLevel === 'log') {
        // Flush all buffered log messages to the console using the configured
        // prefix.
        pendingLogs.forEach((entry) => {
            // eslint-disable-next-line no-console
            console.log(entry[0], logPrefix, ...entry.slice(1));
        });
    }
    // Clear the buffer regardless of the logging level.
    pendingLogs = [];
}

export { log, initLogger, loggerAdapter };
