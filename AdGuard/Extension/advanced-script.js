/**
 * AdGuard Advanced Blocking Extension Script
 *
 * This content-script injects css and scripts.
 */

/* global safari, ExtendedCss */

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
     * Protects specified style element from changes to the current document
     * Add a mutation observer, which is adds our rules again if it was removed
     *
     * @param protectStyleEl protected style element
     */
    const protectStyleElementContent = function (protectStyleEl) {
        const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        if (!MutationObserver) {
            return;
        }
        /* observer, which observe protectStyleEl inner changes, without deleting styleEl */
        const innerObserver = new MutationObserver(((mutations) => {
            for (let i = 0; i < mutations.length; i += 1) {
                const m = mutations[i];
                if (protectStyleEl.hasAttribute('mod') && protectStyleEl.getAttribute('mod') === 'inner') {
                    protectStyleEl.removeAttribute('mod');
                    break;
                }

                protectStyleEl.setAttribute('mod', 'inner');
                let isProtectStyleElModified = false;

                /**
                 * further, there are two mutually exclusive situations: either there were changes
                 * the text of protectStyleEl, either there was removes a whole child "text"
                 * element of protectStyleEl we'll process both of them
                 */
                if (m.removedNodes.length > 0) {
                    for (let j = 0; j < m.removedNodes.length; j += 1) {
                        isProtectStyleElModified = true;
                        protectStyleEl.appendChild(m.removedNodes[j]);
                    }
                } else if (m.oldValue) {
                    isProtectStyleElModified = true;
                    protectStyleEl.textContent = m.oldValue;
                }

                if (!isProtectStyleElModified) {
                    protectStyleEl.removeAttribute('mod');
                }
            }
        }));

        innerObserver.observe(protectStyleEl, {
            'childList': true,
            'characterData': true,
            'subtree': true,
            'characterDataOldValue': true,
        });
    };

    /**
     * Applies css stylesheet
     * @param styleSelectors Array of stylesheets or selectors
     * @param verbose logging
     */
    const applyCss = (styleSelectors, verbose) => {
        if (!styleSelectors || !styleSelectors.length) {
            return;
        }

        logMessage(verbose, `css length: ${styleSelectors.length}`);

        const styleElement = document.createElement('style');
        styleElement.setAttribute('type', 'text/css');
        (document.head || document.documentElement).appendChild(styleElement);

        for (const selector of styleSelectors.map((s) => s.trim())) {
            styleElement.sheet.insertRule(selector);
        }

        protectStyleElementContent(styleElement);
    };

    /**
     * Applies Extended Css stylesheet
     *
     * @param extendedCss Array with ExtendedCss stylesheets
     * @param verbose logging
     */
    const applyExtendedCss = (extendedCss, verbose) => {
        if (!extendedCss || !extendedCss.length) {
            return;
        }

        logMessage(verbose, `extended css length: ${extendedCss.length}`);
        const cssRules = extendedCss
            .filter((s) => s.length > 0)
            .map((s) => s.trim())
            .map((s) => {
                return s[s.length - 1] !== '}'
                    ? `${s} {display:none!important;}`
                    : s;
            });
        const extCss = new ExtendedCss({ cssRules });
        extCss.apply();
    };

    /**
     * Applies scriptlets
     *
     * @param scriptletsData Array with scriptlets data
     * @param verbose logging
     */
    const applyScriptlets = (scriptletsData, verbose) => {
        if (!scriptletsData || !scriptletsData.length) {
            return;
        }

        logMessage(verbose, 'scriptlets length: ' + scriptletsData.length);
        const scriptletExecutableScripts = scriptletsData
            .map((s) => {
                const param = JSON.parse(s);
                param.engine = "safari-extension";
                if (!!verbose) {
                    param.verbose = true;
                }

                let code = '';
                try {
                    code = scriptlets && scriptlets.invoke(param);
                } catch (e) {
                    logMessage(verbose, e.message);
                }
                return code;
            });

        executeScripts(scriptletExecutableScripts, verbose);
    };

    /**
     * Applies injected script and css
     *
     * @param data
     * @param verbose
     */
    const applyAdvancedBlockingData = (data, verbose) => {
        logMessage(verbose, 'Applying scripts and css..');
        logMessage(verbose, `Frame url: ${window.location.href}`);

        applyScripts(data.scripts, verbose);
        applyCss(data.cssInject, verbose);
        applyExtendedCss(data.cssExtended, verbose);
        applyScriptlets(data.scriptlets, verbose);

        logMessage(verbose, 'Applying scripts and css - done');
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
            console.log(`(AdGuard Advanced Blocking) ${message}`);
        }
    };

    /**
     * Handles event from application
     *
     * @param event
     */
    const handleMessage = (event) => {
        if (event.name === 'advancedBlockingData') {
            try {
                const data = JSON.parse(event.message['data']);
                const verbose = JSON.parse(event.message['verbose']);

                // As each frame listens to these events, we need to match frames and received events
                // so here we check if url in event payload matches current location url.
                if (window.location.href === event.message['url']) {
                    applyAdvancedBlockingData(data, verbose);
                }
            } catch (e) {
                console.error(e);
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

            // Request advanced blocking data
            safari.extension.dispatchMessage('getAdvancedBlockingData', { 'url': window.location.href });
        }
    }
})();
