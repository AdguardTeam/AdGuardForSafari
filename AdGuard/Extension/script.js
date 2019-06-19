/**
 * AdGuard Extension Script
 *
 * This content-script serves some assistant requests.
 */

/* global safari */

if (window.top === window) {

    (() => {

        /**
         * Handles extension message
         * @param event
         */
        const handleMessage = event => {
            try {
                switch (event.name) {
                    case "blockElementPing":
                        safari.extension.dispatchMessage("blockElementPong");
                        break;
                    case "blockElement":
                        handleBlockElement();
                        break;

                    default:
                        break;
                }
            } catch (e) {
                console.error(e);
            }
        };

        const handleBlockElement = () => {
            if (!document.getElementById("adguard.assistant.embedded")) {
                // Insert Assistant
                const newElement = document.createElement("script");
                newElement.src = safari.extension.baseURI + "assistant.embedded.js";
                newElement.id = "adguard.assistant.embedded";
                document.head.appendChild(newElement);
            }

            // Reinsert runner
            const runner = document.getElementById("adguard.assistant.embedded.runner");
            if (runner && runner.parentNode) {
                runner.parentNode.removeChild(runner);
            }

            const runnerElement = document.createElement("script");
            runnerElement.src = safari.extension.baseURI + "assistant.runner.js";
            runnerElement.id = "adguard.assistant.embedded.runner";
            runnerElement.addEventListener("assistant.runner-response", (event) => {
                safari.extension.dispatchMessage("ruleResponse", event.detail);
            });
            document.head.appendChild(runnerElement);
        };

        document.addEventListener("DOMContentLoaded", function () {
            safari.self.addEventListener("message", handleMessage);
        });
    })();
}

