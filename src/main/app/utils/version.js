/**
 * Version utils
 */
module.exports = (() => {

    /**
     * Extension version (x.x.x)
     *
     * @param version
     * @constructor
     */
    const Version = function (version) {

        this.version = Object.create(null);

        const parts = String(version || "").split(".");

        function parseVersionPart(part) {
            if (isNaN(part)) {
                return 0;
            }
            return Math.max(part - 0, 0);
        }

        for (let i = 3; i >= 0; i--) {
            this.version[i] = parseVersionPart(parts[i]);
        }
    };

    /**
     * Checks if left version is greater than the right version
     */
    const isGreaterVersion = (leftVersion, rightVersion) => {
        const left = new Version(leftVersion);
        const right = new Version(rightVersion);
        return left.compare(right) > 0;
    };

    return {
        isGreaterVersion: isGreaterVersion
    };

})();