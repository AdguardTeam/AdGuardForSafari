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

        const parts = String(version || '').split('.');

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
     * Compares with other version
     * @param o
     * @returns {number}
     */
    Version.prototype.compare = function (o) {
        for (let i = 0; i < 4; i += 1) {
            if (this.version[i] > o.version[i]) {
                return 1;
            } if (this.version[i] < o.version[i]) {
                return -1;
            }
        }

        return 0;
    };

    /**
     * Checks if left version is greater than the right version
     */
    const isGreaterVersion = (leftVersion, rightVersion) => {
        const left = new Version(leftVersion);
        const right = new Version(rightVersion);
        return left.compare(right) > 0;
    };

    /**
     * Returns major number of version
     *
     * @param version
     */
    const getMajorVersionNumber = (version) => {
        const v = new Version(version);
        return v.version[0];
    };

    /**
     * Returns minor number of version
     *
     * @param version
     */
    const getMinorVersionNumber = (version) => {
        const v = new Version(version);
        return v.version[1];
    };

    return {
        isGreaterVersion,
        getMajorVersionNumber,
        getMinorVersionNumber,
    };
})();
