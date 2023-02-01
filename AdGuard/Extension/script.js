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

        /**
         * Handles assistant requests
         */
        const handleBlockElement = () => {
            if (!document.getElementById("adguard.assistant.embedded")) {
                // Insert Assistant
                const newElement = document.createElement("script");
                newElement.src = safari.extension.baseURI + "assistant.embedded.js";
                newElement.id = "adguard.assistant.embedded";
                newElement.charset = 'utf-8';
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

        /**
         * Add event listener
         */
        document.addEventListener("DOMContentLoaded", function () {
            safari.self.addEventListener("message", handleMessage);
        });
    })();
}

// Script for intercepting adguard subscribe links
(function () {
    if (!(document instanceof HTMLDocument)) {
        return;
    }

    const getSubscriptionParams = (urlParams) => {
        let title = null;
        let url = null;

        for (let i = 0; i < urlParams.length; i += 1) {
            const parts = urlParams[i].split('=', 2);
            if (parts.length !== 2) {
                continue;
            }
            switch (parts[0]) {
                case 'title':
                    title = decodeURIComponent(parts[1]);
                    break;
                case 'location':
                    url = decodeURIComponent(parts[1]);
                    break;
                default:
                    break;
            }
        }

        return {
            title,
            url,
        };
    };

    const onLinkClicked = function (e) {
        if (e.button === 2) {
            // ignore right-click
            return;
        }

        let { target } = e;
        while (target) {
            if (target instanceof HTMLAnchorElement) {
                break;
            }
            target = target.parentNode;
        }

        if (!target) {
            return;
        }

        if (target.protocol === 'http:' || target.protocol === 'https:') {
            if (target.host !== 'subscribe.adblockplus.org' || target.pathname !== '/') {
                return;
            }
        } else if (!(/^abp:\/*subscribe\/*\?/i.test(target.href)
            || /^adguard:\/*subscribe\/*\?/i.test(target.href))) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        let urlParams;
        if (target.search) {
            urlParams = target.search.substring(1).replace(/&amp;/g, '&').split('&');
        } else {
            const { href } = target;
            const index = href.indexOf('?');
            urlParams = href.substring(index + 1).replace(/&amp;/g, '&').split('&');
        }

        const subParams = getSubscriptionParams(urlParams);
        const url = subParams.url.trim();
        const title = (subParams.title || url).trim();

        if (!url) {
            return;
        }

        safari.extension.dispatchMessage('addFilterSubscription', { url, title });
    };

    document.addEventListener('click', onLinkClicked);
})();
