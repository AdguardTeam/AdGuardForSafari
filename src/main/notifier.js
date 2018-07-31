
const events = require('./events');

/**
 * Simple mediator
 */
module.exports = (function () {

    const EventNotifierTypesMap = events;
    const EventNotifierEventsMap = Object.create(null);

    const EventNotifier = {

        listenersMap: Object.create(null),
        listenersEventsMap: Object.create(null),
        listenerId: 0,

        /**
         * Subscribes listener to the specified events
         *
         * @param events    List of event types listener will be notified of
         * @param listener  Listener object
         * @returns Index of the listener
         */
        addSpecifiedListener: function (events, listener) {
            if (typeof listener !== 'function') {
                throw new Error('Illegal listener');
            }
            const listenerId = this.listenerId++;
            this.listenersMap[listenerId] = listener;
            this.listenersEventsMap[listenerId] = events;
            return listenerId;
        },

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
            delete this.listenersEventsMap[listenerId];
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
                const events = this.listenersEventsMap[listenerId];
                if (events && events.length > 0 && events.indexOf(event) < 0) {
                    continue;
                }
                try {
                    const listener = this.listenersMap[listenerId];
                    listener.apply(listener, arguments);
                } catch (ex) {
                    console.error("Error invoking listener for {0} cause: {1}", event, ex);
                }
            }
        },

        /**
         * Asynchronously notifies all listeners about the events passed as arguments of this function.
         * Some events should be dispatched asynchronously, for instance this is very important for Safari:
         * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/251
         */
        notifyListenersAsync: function () {
            const args = arguments;
            setTimeout(function () {
                EventNotifier.notifyListeners.apply(EventNotifier, args);
            }, 500);
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

