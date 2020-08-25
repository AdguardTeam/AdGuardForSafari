/**
 * Injects color styles depending on browser theme
 */

const colorMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'colors-dark-mode.css'
    : 'colors-light-mode.css';

const colorStyle = document.createElement('link');
colorStyle.setAttribute('rel', 'stylesheet');
colorStyle.setAttribute('type', 'text/css');
colorStyle.setAttribute('href', `./css/${colorMode}`);
document.head.appendChild(colorStyle);
