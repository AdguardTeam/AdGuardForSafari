/**
 * Util class for support timeout, retry operations, debounce
 */
module.exports = (() => {

    return {
        /**
         * Executes provided func with wait period
         *
         * @param func
         * @param wait
         * @returns {Function}
         */
        debounce: function (func, wait) {
            let timeout;
            return function () {
                const context = this, args = arguments;
                const later = () =>{
                    timeout = null;
                    func.apply(context, args);
                };

                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };
})();