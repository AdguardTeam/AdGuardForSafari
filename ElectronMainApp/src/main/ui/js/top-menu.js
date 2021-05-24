/**
 * Top menu
 *
 * @type {{init, toggleTab}}
 */

const GENERAL_SETTINGS = '#general-settings';
const ANTIBANNER = '#antibanner';
const ALLOWLIST = '#allowlist';
const USERFILTER = '#userfilter';
const CONTENT_BLOCKERS = '#content-blockers';

let prevTabId;
let onHashUpdatedCallback;

const toggleTab = function () {
    let tabId = document.location.hash || GENERAL_SETTINGS;
    let tab = document.querySelector(tabId);

    if (tabId.indexOf(ANTIBANNER) === 0 && !tab) {
        // AntiBanner groups and filters are loaded and rendered async
        return;
    }

    if (!tab) {
        tabId = GENERAL_SETTINGS;
        tab = document.querySelector(tabId);
    }
    const generalSettingsTab = document.querySelector(`[data-tab="${GENERAL_SETTINGS}"]`);
    const antibannerTabs = document.querySelectorAll(`[data-tab="${ANTIBANNER}"]`);

    if (prevTabId) {
        if (prevTabId.indexOf(ANTIBANNER) === 0) {
            antibannerTabs.forEach((el) => {
                el.classList.remove('active');
            });
        } else if (prevTabId === CONTENT_BLOCKERS) {
            generalSettingsTab.classList.remove('active');
        } else {
            document.querySelector(`[data-tab="${prevTabId}"]`).classList.remove('active');
        }

        document.querySelector(prevTabId).style.display = 'none';
    }

    if (tabId.indexOf(ANTIBANNER) === 0) {
        antibannerTabs.forEach((el) => {
            el.classList.add('active');
        });
    } else {
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    }

    tab.style.display = 'flex';
    window.scrollTo(0, 0);

    if (tabId === ALLOWLIST) {
        if (typeof onHashUpdatedCallback === 'function') {
            onHashUpdatedCallback(tabId);
        }
    }

    if (tabId === ALLOWLIST
        || tabId === USERFILTER
        || tabId.includes(ANTIBANNER)) {
        antibannerTabs[0].classList.add('active');
    } else {
        antibannerTabs[0].classList.remove('active');
    }

    if (tabId === CONTENT_BLOCKERS) {
        generalSettingsTab.classList.add('active');
    }

    prevTabId = tabId;
};

const init = function (options) {
    onHashUpdatedCallback = options.onHashUpdated;

    window.addEventListener('hashchange', toggleTab);
    document.querySelectorAll('[data-tab]').forEach((el) => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            document.location.hash = el.getAttribute('data-tab');
        });
    });

    toggleTab();
};

module.exports = {
    init,
    toggleTab,
};
