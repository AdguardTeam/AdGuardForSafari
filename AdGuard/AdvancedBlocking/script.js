/**
 * AdGuard Advanced Blocking Extension Script
 *
 * This content-script injects css and scripts.
 */

/* global safari, ExtendedCss */

(() => {
    /**
     * Execute scripts in a page context and cleanup itself when execution completes
     * @param scripts Scripts array to execute
     */
    const executeScripts = scripts => {
        // Wrap with try catch
        scripts.unshift('( function () { try {');
        scripts.push("} catch (ex) { console.error('Error executing AG js: ' + ex); } })();");

        const scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'text/javascript');
        scriptTag.textContent = scripts.join('\r\n');

        const parent = document.head || document.documentElement;
        parent.appendChild(scriptTag);
        if (scriptTag.parentNode) {
            scriptTag.parentNode.removeChild(scriptTag);
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
        executeScripts(scripts.reverse());
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

        logMessage(verbose, 'extended css length: ' + extendedCss.length);
        const extcss = new ExtendedCss({
            styleSheet: extendedCss
                .filter(s => s.length > 0)
                .map(s => s.trim())
                .map(s => s[s.length - 1] !== '}' ? `${s} {display:none!important;}` : s)
                .join("\n")
        });
        extcss.apply();
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

                const code = scriptlets && scriptlets.invoke(param);
                return code ? code : '';
            });

        executeScripts(scriptletExecutableScripts);
    };

    /**
     * Applies injected script and css
     *
     * @param data
     * @param verbose
     */
    const applyAdvancedBlockingData = (data, verbose) => {
        logMessage(verbose, 'Applying scripts and css..');

        applyScripts(data.scripts, verbose);
        applyExtendedCss(data.css, verbose);
        applyScriptlets(data.scriptlets, verbose);

        logMessage(verbose, 'Applying scripts and css - done');
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
    const handleMessage = event => {
        if (event.name === "advancedBlockingData") {
            try {
                const data = JSON.parse(event.message["data"]);
                const verbose = JSON.parse(event.message["verbose"]);
                applyAdvancedBlockingData(data, verbose);
            } catch (e) {
                console.error(e);
            }
        }
    };


    if (window.top === window) {
        safari.self.addEventListener("message", handleMessage);

        // Request advanced blocking data
        safari.extension.dispatchMessage("getAdvancedBlockingData");
    }
})();

