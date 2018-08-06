const Store = require('electron-store');
const store = new Store();

/**
 * Filter rules storage implementation
 * TODO: Look for faster and better implementation
 */
module.exports = (() => {

    const getKey = (path) => {
        return 'filter_' + path;
    };

    const read = (path, callback) => {
        const lines = store.get(getKey(path));
        callback(lines);
    };

    const write = (path, data, callback) => {
        store.set(getKey(path), data);
        callback();
    };

    const remove = (path, successCallback) => {
        store.delete(getKey(path));
        successCallback();
    };

    return {
        read: read,
        write: write,
        remove: remove
    };

})();