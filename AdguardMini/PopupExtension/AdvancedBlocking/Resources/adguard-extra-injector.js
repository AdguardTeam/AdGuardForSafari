/**
 * AdGuard Extra Injector Extension Script
 *
 * This content-script injects AdGuard Extra.
 *
 * SPDX-FileCopyrightText: AdGuard Software Limited
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/* global safari */

(() => {
    /**
     * Initialize the default logger with no logs
     */
    let log = (message) => {};

    /**
     * Executes code in the context of the page via new script tag and text content.
     * @param code String of scripts to be executed
     * @returns {boolean} Returns true if code was executed, otherwise returns false
     */
    const executeScriptsViaTextContent = (code) => {
        const scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'text/javascript');
        scriptTag.textContent = code;
        const parent = document.head || document.documentElement;
        parent.appendChild(scriptTag);
        if (scriptTag.parentNode) {
            scriptTag.parentNode.removeChild(scriptTag);
            return false;
        }
        return true;
    };

    /**
     * Executes code in the context of page via new script tag and blob. We use this way as fallback,
     * if we fail to inject via textContent
     * @param code String of scripts to be executed
     * @returns {boolean} Returns true if code was executed, otherwise returns false.
     */
    const executeScriptsViaBlob = (code) => {
        const blob = new Blob([code], {type: 'text/javascript'});
        const url = URL.createObjectURL(blob);
        const scriptTag = document.createElement('script');
        scriptTag.src = url;
        const parent = document.head || document.documentElement;
        parent.appendChild(scriptTag);
        URL.revokeObjectURL(url);
        if (scriptTag.parentNode) {
            scriptTag.parentNode.removeChild(scriptTag);
            return false;
        }
        return true;
    };

    /**
     * Execute scripts in a page context and cleanup itself when execution completes
     * @param scripts Array of scripts to execute
     */
    const executeScripts = (scripts = []) => {
        scripts.unshift('( function () { try {');
        // we use this script detect if the script was applied,
        // if the script tag was removed, then it means that code was applied, otherwise no
        scripts.push(`;document.currentScript.remove();`);
        scripts.push("} catch (ex) { console.error('Error executing AG js: ' + ex); } })();");
        const code = scripts.join('\r\n');
        if (!executeScriptsViaTextContent(code)) {
            log('Unable to inject via text content');
            if(!executeScriptsViaBlob(code)) {
                log('Unable to inject via blob');
            }
        }
    };

    /**
     * Applies JS injections.
     * @param scripts Array with JS scripts
     */
    const applyScripts = (scripts) => {
        if (!scripts || scripts.length === 0) {
            return;
        }

        log('scripts length: ' + scripts.length);
        executeScripts(scripts.reverse());
    };

    /**
     * Applies injected AdGuard Extra
     *
     * @param script
     */
    const applyAdGuardExtraData = (script) => {
        log('Applying scripts and css...');
        log(`Frame url: ${window.location.href}`);

        const scripts = [script];

        applyScripts(scripts);

        log('Applying scripts and css - done');
        safari.self.removeEventListener('message', handleMessage);
    };

    /**
     * Logs a message if verbose is true
     *
     * @param verbose
     * @param message
     */
    const logMessage = (verbose, message) => {
        if (verbose) {
            const timestamp = `[${new Date().toISOString()}]`;
            console.log(timestamp, '[AdGuard Extra Blocking]', message);
        }
    };

    /**
     * Initialize the logger
     * @param verbose
     */
    const initiateLog = (verbose) => {
        log = (message) => logMessage(verbose, message);
    };

    // Generate a pseudo-unique request ID for properly tracing the response to the
    // request that was sent by this instance of a SFSafariContentScript.
    // We will only accept responses to this specific request.
    const requestId = Math.random().toString(36);

    /**
     * Handles event from application
     *
     * @param event
     */
    const handleMessage = (event) => {
        console.log(`[AdGuard Extra Blocking] Content script received message: ${event.name}`);
        if (event.name === 'adguardExtraData') {
            try {
                const script = [event.message['script']];
                const verbose = JSON.parse(event.message['verbose']);
                initiateLog(verbose);
                const responseRequestId = event.message['requestId'];

                if (!responseRequestId) {
                    throw Error('No request ID received');
                }

                if (responseRequestId !== requestId) {
                    return;
                }

                applyAdGuardExtraData(script);
            } catch (e) {
                console.error(`[AdGuard Extra Blocking] Error: ${e}`);
            }
        }
    };

    /**
     * With the following limitation we fix some troubles with Gmail and scrolling on various websites
     * https://github.com/AdguardTeam/AdGuardForSafari/issues/433
     * https://github.com/AdguardTeam/AdGuardForSafari/issues/441
     */
    if (document instanceof HTMLDocument) {
        if (window.location.href && window.location.href.indexOf('http') === 0) {
            safari.self.addEventListener('message', handleMessage);

            // Request AdGuard Extra data
            safari.extension.dispatchMessage('getAdGuardExtraData', { 'url': window.location.href, requestId });
        }
    }
})();
