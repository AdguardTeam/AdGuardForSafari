// const { nativeTheme } = require('electron');

const cssDarkMode = 'colors-dark-mode.css';
const cssLightMode = 'colors-light-mode.css';

const cssMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? cssDarkMode : cssLightMode;

const linkElement = document.createElement('link');
linkElement.setAttribute('rel', 'stylesheet');
linkElement.setAttribute('type', 'text/css');
linkElement.setAttribute('href', `./css/${cssMode}`);
document.head.appendChild(linkElement);
