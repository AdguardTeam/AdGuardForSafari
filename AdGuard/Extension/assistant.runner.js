(function () {
    var node = document.currentScript;
    if (window.AdguardAssistant) {
        console.log("(AdGuard Ext) Stoping AdGuard Assistant.");
        AdguardAssistant.close();
    }
    else {
        window.AdguardAssistant = new adguardAssistant();
    }
    console.log("(AdGuard Ext) Starting AdGuard Assistant.");
    window.AdguardAssistant.start(null,
                          (rule) =>{
                          console.log("(AdGuard Ext) AdGuard Assistant callback.");
                          var event = new CustomEvent("assistant.runner-response", {
                                                      detail: {"rule":rule},
                                                      "bubbles": true,
                                                      "cancelable": false
                                                      });
                          node.dispatchEvent(event);
                          });
 })();
