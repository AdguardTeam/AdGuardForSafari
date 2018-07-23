const Store = require('electron-store');
const store = new Store();

/**
 * Storage implementation
 */
module.exports = (function () {

    const getItem = (key) => {
        return store.get(key);
    };

    const setItem = (key, value) => {
        store.set(key, value);
    };

    const removeItem = key => {
        store.delete(key);
    };

    const hasItem = (key) => {
        return !!store.get(key);
    };

    return {
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        hasItem: hasItem,
    };

})();