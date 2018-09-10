(function () {
 var node = document.currentScript;
 console.log("(AdGuard Ext) Stoping AdGuard Assistant.");
 adguardAssistant().close();
 console.log("(AdGuard Ext) Starting AdGuard Assistant.");
 adguardAssistant().start(null,
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
