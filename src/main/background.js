const {ipcMain} = require('electron');

module.exports.init = function() {
    ipcMain.on('message', function(event, arg) {

        //log.debug("Received a message from the UI: %s", arg);
        const message = JSON.parse(arg);
        switch (message.type) {
            case 'test':
                event.sender.send('test-answer', '123');
                break;
        }
    });
};