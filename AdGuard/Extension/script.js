if (window.top === window) {
    console.log("(AdGuard Ext) Loading in main frame.");

    var handleMessage = function (event) {
        console.log("(AdGuard Ext) Get message from extention %s.",event.name);
        switch (event.name) {
            case "blockElementPing":
                safari.extension.dispatchMessage("blockElementPong");
                break;

            case "blockElement":
                if ( ! document.getElementById("adguard.assistant.embedded")){
                    //Insert Assistant
                    var newElement = document.createElement("script");
                    newElement.src = safari.extension.baseURI + "assistant.embedded.js";
                    newElement.id = "adguard.assistant.embedded";
                    document.head.appendChild(newElement);
                }
                // reinsert runner
                var runner = document.getElementById("adguard.assistant.embedded.runner");
                if (runner && runner.parentNode) {
                    runner.parentNode.removeChild(runner);
                }
                var newElement = document.createElement("script");
                newElement.src = safari.extension.baseURI + "assistant.runner.js";
                newElement.id = "adguard.assistant.embedded.runner";
                newElement.addEventListener("assistant.runner-response", (event) => {
                                            console.log("(AdGuard Ext) Get response from runner");
                                            safari.extension.dispatchMessage("ruleResponse", event.detail);
                                            });
                document.head.appendChild(newElement);

                break;

            default:
                break;
        }
    }

    document.addEventListener("DOMContentLoaded", function(event) {
                              safari.self.addEventListener("message", handleMessage);
                              console.log("(AdGuard Ext) Added Listener for messages from app extension.");
                              });
}

