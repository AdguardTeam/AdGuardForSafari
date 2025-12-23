// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

// Make a box, represents sciter window, and put all contents inside
const sciterWindowDiv = document.createElement('div');
sciterWindowDiv.id = 'sciter-window';
document.body.append(sciterWindowDiv);

const MAX_HEIGHT = 600;

[...document.body.children].slice(0, -1).forEach((element) => {
    sciterWindowDiv.append(element);
});

Object.assign(sciterWindowDiv.style, {
    width: '800px',
    // height: `${MAX_HEIGHT}px`,
    border: '1px solid #ccc',
    transform: 'translate(100px, 100px)',
    boxShadow: '0 0 34px 12px rgba(171,171,171,0.75)',
    overflow: 'hidden'
} as CSSStyleDeclaration);

function translateOnResize() {
    if (window.innerWidth <= 960) {
        sciterWindowDiv.style.transform = `translate(${Math.max(0, window.innerWidth - 860)}px, 100px)`
    } else {
        sciterWindowDiv.style.transform = 'translate(100px, 100px)';
    }
}

window.addEventListener('resize', translateOnResize);
translateOnResize();

// Match theme
const theme = document.documentElement.getAttribute('theme');
if (theme) {
    document.documentElement.setAttribute('theme', theme.toLowerCase());
}

/**
 * Crutches
 */
document.getElementById('app')!.style.height = '100%';

// Cannot input in browser
const originalFocus = HTMLElement.prototype.focus;
HTMLElement.prototype.focus = function focus(...args: Parameters<typeof originalFocus>) {
    if (this.tagName !== 'DIV') {
        originalFocus.apply(this, args);
    }
}

setInterval(() => {
    document.querySelectorAll('svg:not([data-updated])').forEach((svg) => {
        // I don't know what the fuck going on, but this code fix icons disappearing in browser
        (svg as SVGElement).dataset.updated = 'true';
        const html = svg.outerHTML;
        const parent = svg.parentElement;
        if (parent) {
            parent.removeChild(svg);
            parent.innerHTML = html;
        }
    });

    document.querySelectorAll('[class*=page]:not([data-updated])').forEach((pageElement) => {
        (pageElement as HTMLElement).dataset.updated = 'true';
        const paddingToPageInSciterWindow = pageElement.getBoundingClientRect().y - sciterWindowDiv.getBoundingClientRect().y;
        if (pageElement instanceof HTMLElement) {
            pageElement.style.overflowY = 'auto';
            pageElement.style.height = `${MAX_HEIGHT - paddingToPageInSciterWindow}px`;
        }
    });
}, 750);

