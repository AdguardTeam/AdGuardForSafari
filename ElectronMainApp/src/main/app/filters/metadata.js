module.exports = (function () {
    /**
     * Filter metadata
     */
    const SubscriptionFilter = function (filterId,
        groupId,
        name,
        description,
        homepage,
        version,
        timeUpdated,
        displayNumber,
        languages,
        expires,
        subscriptionUrl,
        tags) {
        this.filterId = filterId;
        this.groupId = groupId;
        this.name = name;
        this.description = description;
        this.homepage = homepage;
        this.version = version;
        this.timeUpdated = timeUpdated;
        this.displayNumber = displayNumber;
        this.languages = languages;
        this.expires = expires;
        this.subscriptionUrl = subscriptionUrl;
        this.tags = tags;
    };

    /**
     * Tag metadata
     */
    const FilterTag = function (tagId, keyword) {
        this.tagId = tagId;
        this.keyword = keyword;
    };

    /**
     * Group metadata
     */
    const SubscriptionGroup = function (groupId, groupName, displayNumber) {
        this.groupId = groupId;
        this.groupName = groupName;
        this.displayNumber = displayNumber;
    };

    return {
        SubscriptionFilter,
        SubscriptionGroup,
        FilterTag,
    };
})();
