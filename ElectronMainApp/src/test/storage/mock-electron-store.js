class Store {
    localStore = {};

    set(key, value) {
        this.localStore[key] = value;
    }

    has(key) {
        return !!this.localStore[key];
    }

    get(key) {
        if (this.has(key)) {
            return this.localStore[key];
        }
    }

    delete(key) {
        if (this.has(key)) {
            delete this.localStore[key];
        }
    }
}

module.exports = Store;
