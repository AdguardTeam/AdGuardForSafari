const events = require('./events');
const log = require('./app/utils/log');

/**
 * Simple mediator
 */
module.exports = (function () {

    const ASYNC_NOTIFICATION_DELAY = 500;

    const EventNotifierTypesMap = events;
    const EventNotifierEventsMap = Object.create(null);

    const EventNotifier = {

        listenersMap: Object.create(null),
        listenerId: 0,

        /**
         * Subscribe specified listener to all events
         *
         * @param listener Listener
         * @returns Index of the listener
         */
        addListener: function (listener) {
            if (typeof listener !== 'function') {
                throw new Error('Illegal listener');
            }
            const listenerId = this.listenerId++;
            this.listenersMap[listenerId] = listener;
            return listenerId;
        },

        /**
         * Unsubscribe listener
         * @param listenerId Index of listener to unsubscribe
         */
        removeListener: function (listenerId) {
            delete this.listenersMap[listenerId];
        },

        /**
         * Notifies listeners about the events passed as arguments of this function.
         */
        notifyListeners: function () {
            let event = arguments[0];
            if (!event || !(event in EventNotifierEventsMap)) {
                throw new Error('Illegal event: ' + event);
            }
            for (let listenerId in this.listenersMap) { // jshint ignore:line
                try {
                    const listener = this.listenersMap[listenerId];
                    listener.apply(listener, arguments);
                } catch (ex) {
                    log.error("Error invoking listener for {0} cause: {1}", event, ex);
                }
            }
        },

        /**
         * Asynchronously notifies all listeners about the events passed as arguments of this function.
         * Some events should be dispatched asynchronously, for instance this is very important for Safari:
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/251
         * TODO: Should use it probably
         */
        notifyListenersAsync: function () {
            const args = arguments;
            setTimeout(function () {
                EventNotifier.notifyListeners.apply(EventNotifier, args);
            }, ASYNC_NOTIFICATION_DELAY);
        }
    };

    // Make accessible only constants without functions. They will be passed to content-page
    EventNotifier.events = EventNotifierTypesMap;

    // Copy global properties
    for (let key in EventNotifierTypesMap) {
        if (EventNotifierTypesMap.hasOwnProperty(key)) {
            var event = EventNotifierTypesMap[key];
            EventNotifier[key] = event;
            if (event in EventNotifierEventsMap) {
                throw new Error('Duplicate event:  ' + event);
            }
            EventNotifierEventsMap[event] = key;
        }
    }

    return EventNotifier;

})();

