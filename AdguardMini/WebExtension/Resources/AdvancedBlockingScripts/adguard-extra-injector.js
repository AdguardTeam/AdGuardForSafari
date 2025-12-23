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
     * @param verbose logging
     */
    const executeScripts = (scripts = [], verbose) => {
        scripts.unshift('( function () { try {');
        // we use this script detect if the script was applied,
        // if the script tag was removed, then it means that code was applied, otherwise no
        scripts.push(`;document.currentScript.remove();`);
        scripts.push("} catch (ex) { console.error('Error executing AG js: ' + ex); } })();");
        const code = scripts.join('\r\n');
        if (!executeScriptsViaTextContent(code)) {
            logMessage(verbose, 'Unable to inject via text content');
            if(!executeScriptsViaBlob(code)) {
                logMessage(verbose, 'Unable to inject via blob');
            }
        }
    };

    /**
     * Applies JS injections.
     * @param scripts Array with JS scripts
     * @param verbose logging
     */
    const applyScripts = (scripts, verbose) => {
        if (!scripts || scripts.length === 0) {
            return;
        }

        logMessage(verbose, 'scripts length: ' + scripts.length);
        executeScripts(scripts.reverse(), verbose);
    };

    /**
     * Applies injected AdGuard Extra
     *
     * @param script
     * @param verbose
     */
    const applyAdGuardExtraData = (script, verbose) => {
        logMessage(verbose, 'Applying AdGuard Extra...');
        logMessage(verbose, `Frame url: ${window.location.href}`);

        const scripts = [script];

        applyScripts(scripts, verbose);

        logMessage(verbose, 'Applying AdGuard Extra - done');
    };

    /**
     * Logs a message if verbose is true
     *
     * @param verbose
     * @param message
     */
    const logMessage = (verbose, message) => {
        if (verbose) {
            console.log(`[AdGuard Extra Blocking] ${message}`);
        }
    };

    let extraWasInjected = false;

    /**
     * Checks if the conditions for injecting the extra script are met
     *
     * @returns {boolean}
     */
    const checkInjectPreconditions = () => {
        return (
            // Can be injected few times, so we need to check if it was injected before
            !extraWasInjected &&
            // This document must be HTML, not XML, SVG, etc.
            document instanceof HTMLDocument &&
            // Suitable url
            window.location.protocol.indexOf('http') === 0
        );
    };

    /**
     * Handles event from application
     */
    const handleMessage = (message) => {
        if (
            checkInjectPreconditions() &&
            // Suitable message type
            message.type === "injectExtraScript" && 
            // Script must be provided
            message.script != null
        ) {
            const { script, verbose } = message;

            try {
                applyAdGuardExtraData([script], verbose);
            } catch (e) {
                console.error(e);
            }
        }
    };
    
    // Listen for messages from the background script
    browser.runtime.onMessage.addListener(handleMessage);

    // Should send that, because extra can be injected multiple times on the same page
    if (checkInjectPreconditions()) {
        browser.runtime.sendMessage({
            type: "requestExtraFromTab"
        });
    }
})();
