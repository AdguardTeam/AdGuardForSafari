/**
 *
 */
(function () {
    var node = document.currentScript;

    if (window.AdguardAssistant) {
        console.log("(AdGuard Ext) Stopping AdGuard Assistant..");
        AdguardAssistant.close();
        console.log("(AdGuard Ext) Stopping AdGuard Assistant..ok");
    }
    else {
        window.AdguardAssistant = new adguardAssistant();
    }

    console.log("(AdGuard Ext) Starting AdGuard Assistant..");
    window.AdguardAssistant.start(null,
        (rule) => {
            console.log("(AdGuard Ext) AdGuard Assistant callback.");

            node.dispatchEvent(new CustomEvent("assistant.runner-response", {
                detail: {
                    "rule": rule
                },
                "bubbles": true,
                "cancelable": false
            }));
        });
    console.log("(AdGuard Ext) Starting AdGuard Assistant..ok");

})();
