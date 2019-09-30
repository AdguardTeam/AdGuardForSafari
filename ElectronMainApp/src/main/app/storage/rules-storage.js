const Store = require('electron-store');
const store = new Store();

/**
 * Filter rules storage implementation
 */
module.exports = (() => {

    const cache = Object.create(null);

    const getKey = (path) => {
        return 'filter_' + path;
    };

    const read = (path, callback) => {
        const cached = cache[path];
        if (cached) {
            callback(cached);
            return;
        }

        const lines = store.get(getKey(path));
        cache[path] = lines;

        callback(lines);
    };

    const write = (path, data, callback) => {
        cache[path] = data;

        store.set(getKey(path), data);
        callback();
    };

    const remove = (path, successCallback) => {
        delete cache[path];

        store.delete(getKey(path));
        successCallback();
    };

    return {
        read: read,
        write: write,
        remove: remove
    };

})();