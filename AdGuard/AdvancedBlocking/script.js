/**
 * AdGuard Advanced Blocking Extension Script
 *
 * This content-script injects css and scripts.
 */

/* global safari, ExtendedCss */

/**
 * Execute scripts in a page context and cleanup itself when execution completes
 * @param {string} scripts Scripts array to execute
 */
const executeScripts = function (scripts) {
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
 */
const applyScripts = function (scripts) {
    if (!scripts || scripts.length === 0) {
        return;
    }

    console.log('(AdGuard Advanced Blocking) scripts length: ' + scripts.length);
    executeScripts(scripts);
};

/**
 * Applies Extended Css stylesheet
 *
 * @param extendedCss Array with ExtendedCss stylesheets
 */
const applyExtendedCss = function (extendedCss) {
    if (!extendedCss || !extendedCss.length) {
        return;
    }

    console.log('(AdGuard Advanced Blocking) extended css length: ' + extendedCss.length);
    const extcss = new ExtendedCss({
        styleSheet: extendedCss
            .filter(s => s.length > 0)
            .map(s => s.trim())
            .map(s => s[s.length] !== '}' ? `${s} {display:none!important;}` : s)
            .join("\n")
    });
    extcss.apply();
};

/**
 * Applies injected script and css
 *
 * @param data
 */
const applyAdvancedBlockingData = function (data) {
    console.log('(AdGuard Advanced Blocking) Applying scripts and css..');

    applyScripts(data.scripts);
    applyExtendedCss(data.css);
    
    console.log('(AdGuard Advanced Blocking) Applying scripts and css - done');
};

/**
 * Handles event from application
 *
 * @param event
 */
const handleMessage = function (event) {
    console.log("(AdGuard Advanced Blocking) Received message from extension: %s.", event.name);
    
    if (event.name === "advancedBlockingData") {
        try {
            const data = JSON.parse(event.message["data"]);
            applyAdvancedBlockingData(data);
        } catch (e) {
            console.error(e);
        }
    }
};


if (window.top === window) {
    console.log("(AdGuard Advanced Blocking) Loading in main frame..");

    safari.self.addEventListener("message", handleMessage);
    console.log("(AdGuard Advanced Blocking) Added Listener for messages from app extension.");

    // Request advanced blocking data
    safari.extension.dispatchMessage("getAdvancedBlockingData");
    
    console.log("(AdGuard Advanced Blocking) Loading in main frame - done");
}

