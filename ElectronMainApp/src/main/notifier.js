const events = require('./events');
const log = require('./app/utils/log');

/**
 * Simple mediator
 */
module.exports = (function () {
    const EventNotifierTypesMap = events;
    const EventNotifierEventsMap = Object.create(null);

    // Copy global properties
    for (const key in EventNotifierTypesMap) {
        if (EventNotifierTypesMap.hasOwnProperty(key)) {
            const event = EventNotifierTypesMap[key];
            if (event in EventNotifierEventsMap) {
                throw new Error(`Duplicate event:  ${event}`);
            }
            EventNotifierEventsMap[event] = key;
        }
    }

    return {

        events: EventNotifierTypesMap,
        listenersMap: Object.create(null),
        listenerId: 0,

        /**
         * Subscribe specified listener to all events
         *
         * @param listener Listener
         * @returns Index of the listener
         */
        addListener(listener) {
            if (typeof listener !== 'function') {
                throw new Error('Illegal listener');
            }
            /* eslint-disable-next-line no-multi-assign */
            const listenerId = this.listenerId += 1;
            this.listenersMap[listenerId] = listener;
            return listenerId;
        },

        /**
         * Unsubscribe listener
         * @param listenerId Index of listener to unsubscribe
         */
        removeListener(listenerId) {
            delete this.listenersMap[listenerId];
        },

        /**
         * Notifies listeners about the events passed as arguments of this function.
         */
        notifyListeners() {
            const event = arguments[0];
            if (!event || !(event in EventNotifierEventsMap)) {
                throw new Error(`Illegal event: ${event}`);
            }
            for (const listenerId in this.listenersMap) { // jshint ignore:line
                try {
                    const listener = this.listenersMap[listenerId];
                    listener.apply(listener, arguments);
                } catch (ex) {
                    log.error('Error invoking listener for {0} cause: {1}', event, ex);
                }
            }
        },
    };
})();
