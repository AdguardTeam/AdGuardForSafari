/**
 * AdGuard Advanced Blocking Extension Script
 *
 * This content-script injects css and scripts.
 */

/**
 * Applies injected script and css
 *
 * @param data
 */
var applyAdvancedBlockingData = function (data) {
    console.log('(AdGuard Advanced Blocking) Applying scripts and css..');

    //TODO: Apply scripts and css
    console.log(data);

    console.log('(AdGuard Advanced Blocking) Applying scripts and css - done');
};

/**
 * Handles event from application
 *
 * @param event
 */
var handleMessage = function (event) {
    console.log("(AdGuard Advanced Blocking) Received message from extention: %s.", event.name);

    if (event.name === "advancedBlockingData") {
        applyAdvancedBlockingData(event.message["data"]);
    }
};


if (window.top === window) {
    console.log("(AdGuard Advanced Blocking) Loading in main frame..");

    // TODO: Find out if it is possible to do it earlier
    document.addEventListener("DOMContentLoaded", function (event) {
        safari.self.addEventListener("message", handleMessage);
        console.log("(AdGuard Advanced Blocking) Added Listener for messages from app extension.");

        // Request advanced blocking data
        safari.extension.dispatchMessage("getAdvancedBlockingData");
    });

    console.log("(AdGuard Advanced Blocking) Loading in main frame - done");
}

