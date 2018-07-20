console.log('Options page started');

const {ipcRenderer} = require('electron');

ipcRenderer.send('message', JSON.stringify({
    'type': 'test'
}));

ipcRenderer.on('test-answer', (e, arg) => {
    console.log('Answer received');
    console.log(arg);
});