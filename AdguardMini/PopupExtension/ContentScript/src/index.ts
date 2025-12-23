/**
 * @file App extension content script.
 *
 * The script initializes content script, and AdGuard Assistant functionality by listening
 * for messages from the Safari extension. It uses a delayed dispatcher
 * to handle DOM events and sends a rule request message to the extension.
 */

import {
    type Configuration,
    ContentScript,
    setupDelayedEventDispatcher,
    setLogger,
} from '@adguard/safari-extension';
// Embedded AdGuard Assistant
import '@adguard/assistant/dist/assistant';
import type { Assistant } from '@adguard/assistant';

import { log, initLogger, loggerAdapter } from './logger';

/**
 * Defines the shape of the message requesting rules from the extension backend.
 */
interface RequestRulesRequestMessage {
    /**
     * A pseudo-unique request ID for properly tracing the response to the
     * request that was sent by this instance of a SFSafariContentScript.
     * We will only accept responses to this specific request.
     *
     * The problem we are solving here is that Safari propagates responses from
     * the app extension down to subframes (and calling preventDefault and
     * stopPropagation does not stop it). So in order to avoid processing
     * responses from other instances of SFSafariContentScript, we use a
     * pseudo-unique request ID.
     */
    requestId: string;
    // The URL of the page that requested rules.
    url: string;
    // The top-level URL of the page that requested rules.
    topUrl: string | null;
    // The timestamp of the request.
    requestedAt: number;
}

enum DispatchEvents {
    RuleResponse = 'ruleResponse',
    RequestRules = 'requestRules',
    AddFilterSubscription = 'addFilterSubscription',
    BlockElementPong = 'blockElementPong',
}

enum ReceivedEvents {
    BlockElementPing = 'blockElementPing',
    BlockElement = 'blockElement',
}

/**
 * Defines the shape of the response message containing configuration data.
 */
interface RequestRulesResponseMessage {
    // Request ID of the corresponding request.
    requestId: string;
    // The configuration payload. If provided, it is used to initialize the
    // content script.
    payload: Configuration | undefined;
    // Flag to indicate whether verbose logging should be enabled.
    verbose: boolean | undefined;
    // Timestamp when the request was made.
    requestedAt: number;
}

log('Content script is starting...');

// Initialize the delayed event dispatcher. This may intercept DOMContentLoaded
// and load events. The delay of 100ms is used as a buffer to capture critical
// initial events while waiting for the rules response.
const cancelDelayedDispatchAndDispatch = setupDelayedEventDispatcher(100);

// Generate a pseudo-unique request ID for properly tracing the response to the
// request that was sent by this instance of a SFSafariContentScript.
// We will only accept responses to this specific request.
const requestId = Math.random().toString(36);

/**
 * Callback function to handle response messages from the Safari extension.
 *
 * This function processes the rules response message:
 * - If a configuration payload is received, it instantiates and runs the
 *   ContentScript.
 * - It logs the elapsed time between the request and the response for
 *   performance monitoring.
 * - It toggles verbose logging based on the configuration included in
 *   the response.
 * - It cancels any pending delayed event dispatch logic to allow the page's
 *   natural event flow.
 *
 * @param event SafariExtensionMessageEvent - The message event from the
 * extension.
 */
const handleMessage = (event: SafariExtensionMessageEvent) => {
    log('Received message: ', event);

    // Cast the received event message to our expected
    // RequestRulesResponseMessage type.
    const message = event.message as RequestRulesResponseMessage;

    if (message?.requestId !== requestId) {
        log('Received response for a different request ID: ', message?.requestId);
        return;
    }

    // If the configuration payload exists, run the ContentScript with it.
    if (message?.payload) {
        const configuration = message.payload as Configuration;
        const contentScript = new ContentScript();
        setLogger(loggerAdapter);
        contentScript.applyConfiguration(configuration);
        log('ContentScript applied');
    }

    // Compute the elapsed time since the rules request was initiated.
    const elapsed = new Date().getTime() - (message?.requestedAt ?? 0);
    log('Elapsed on messaging: ', elapsed);

    // Initialize the logger using the verbose flag from the response:
    // If verbose, use a prefix; otherwise, disable logging.
    if (message?.verbose) {
        initLogger('log', '[AdGuard Mini Advanced Blocking]');
    } else {
        initLogger('discard', '');
    }

    // Cancel the pending delayed event dispatch and process any queued events.
    cancelDelayedDispatchAndDispatch();
};

/**
 * Returns the top-level URL of the current page or null if we're not
 * in an iframe.
 *
 * @returns {string | null} The top-level URL or null if we're not in an iframe.
 */
function getTopUrl(): string | null {
    try {
        if (window.top === window.self) {
            return null;
        }

        if (!window.top) {
            // window.top cannot be null under normal circumstances so assume
            // we're in an iframe.
            return 'https://third-party-domain.com/';
        }

        return window.top.location.href;
    } catch (ex) {
        log('Failed to get top URL: ', ex);

        // Return a random third-party domain as this error signals us
        // that we're in a third-party frame.
        return 'https://third-party-domain.com/';
    }
}

/**
 * Returns URL of the current page. If we're in an about:blank iframe, handles
 * it and returns the URL of the top page.
 */
function getUrl(): string {
    let url = window.location.href;
    const topUrl = getTopUrl();

    if (!url.startsWith('http') && topUrl) {
        // Handle the case of non-HTTP iframes, i.e. frames created by JS.
        // For instance, frames can be created as 'about:blank' or 'data:text/html'
        url = topUrl;
    }

    return url;
}

// Prepare the message to request configuration rules for the current page.
const message: RequestRulesRequestMessage = {
    requestId,
    url: getUrl(),
    topUrl: getTopUrl(),
    requestedAt: new Date().getTime(),
};

// Dispatch the "requestRules" message to the Safari extension.
safari.extension.dispatchMessage(DispatchEvents.RequestRules, message);

// Register the event listener for incoming messages from the extension.
safari.self.addEventListener('message', handleMessage);

// Assistant block
declare global {
    const AdguardAssistant: Assistant;

    function adguardAssistant(): Assistant;
    interface Window {
        AdguardAssistant: Assistant;
    }
}

/**
 * Run AdGuard Assistant
 */
function runAssistant() {
    if (window.AdguardAssistant) {
        log('[AdGuard Mini Assistant] Stopping AdGuard Assistant..');
        AdguardAssistant.close();
        log('[AdGuard Mini Assistant] Stopping AdGuard Assistant..ok');
    } else {
        window.AdguardAssistant = adguardAssistant();
    }

    log('[AdGuard Mini Assistant] Starting AdGuard Assistant..');
    window.AdguardAssistant.start(
        null,
        (rule) => {
            log('[AdGuard Mini Assistant] AdGuard Assistant callback.');

            safari.extension.dispatchMessage(DispatchEvents.RuleResponse, { rule });
        },
    );
    log('[AdGuard Mini Assistant] Starting AdGuard Assistant..ok');
}

/**
 * AdGuard Extension Script
 *
 * This content-script serves some assistant requests.
 */

if (window.top === window) {
    (() => {
        /**
         * Handles extension message
         *
         * @param event
         */
        const handleAssistantMessage = (event: SafariExtensionMessageEvent) => {
            try {
                switch (event.name) {
                    case ReceivedEvents.BlockElementPing:
                        safari.extension.dispatchMessage(DispatchEvents.BlockElementPong);
                        break;
                    case ReceivedEvents.BlockElement:
                        runAssistant();
                        break;
                    default:
                        break;
                }
            } catch (e) {
                log(`[AdGuard Mini Assistant] Error: ${e}`);
            }
        };

        /**
         * Add event listener
         */
        document.addEventListener('DOMContentLoaded', () => {
            safari.self.addEventListener('message', handleAssistantMessage);
        });
    })();
}

// Script for intercepting adguard subscribe links
(function () {
    if (!(document instanceof HTMLDocument)) {
        return;
    }

    const getSubscriptionParams = (urlParams: string[]) => {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onLinkClicked = (e: any) => {
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
        const url = subParams.url?.trim();
        const title = (subParams.title || url)?.trim();

        if (!url) {
            return;
        }

        safari.extension.dispatchMessage(DispatchEvents.AddFilterSubscription, { url, title });
    };

    document.addEventListener('click', onLinkClicked);
}());
