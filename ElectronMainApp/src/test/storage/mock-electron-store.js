class Store {
    localStore = {};

    set(key, value) {
        this.localStore[key] = value;
    }

    get(key) {
        return this.localStore[key];
    }

    delete(key) {
        delete this.localStore[key];
    }

    has(key) {
        return !!this.localStore[key];
    }
}

module.exports = Store;
