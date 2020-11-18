//
//  ContentBlockerContainer.swift
//  AdvancedBlocking
//
//  Created by Dimitry Kolyshev on 30.01.2019.
//  Copyright © 2020 AdGuard Software Ltd. All rights reserved.
//

import Foundation

// Storage and parser
class ContentBlockerContainer {
    private var blockerEntries: Array<BlockerEntry>;
    private var networkEngine: NetworkEngine;

    // Constructor
    init() {
        blockerEntries = [];
        networkEngine = NetworkEngine();
    }

    // Parses and saves json
    func setJson(json: String) throws {
        // Parse "content-blocker" json
        blockerEntries = try parseJsonString(json: json);

        // Parse shortcuts
        for i in 0 ..< blockerEntries.count {
            blockerEntries[i].trigger.setShortcut(shortcutValue: parseShortcut(urlMask: blockerEntries[i].trigger.urlFilter));
        }

        // Init network engine
        networkEngine = NetworkEngine();
        networkEngine.addRules(entries: blockerEntries);
    }

    // Parses url shortcuts
    private func parseShortcut(urlMask: String?) -> String? {
        // Skip empty string
        if urlMask == nil || urlMask == "" {
            return nil;
        }

        let mask = urlMask!;


        // Skip all url templates
        if (mask == ".*" || mask == "^[htpsw]+://") {
            return nil;
        }

        var shortcut: String? = "";
        let isRegexRule = mask.hasPrefix("/") && mask.hasSuffix("/");
        if (isRegexRule) {
            shortcut = findRegexpShortcut(pattern: mask);
        } else {
            shortcut = findShortcut(pattern: mask);
        }

        // shortcut needs to be at least longer than 1 character
        if shortcut != nil && shortcut!.count > 1 {
            return shortcut;
        } else {
            return nil;
        }
    }

    // findRegexpShortcut searches for a shortcut inside of a regexp pattern.
    // Shortcut in this case is a longest string with no REGEX special characters
    // Also, we discard complicated regexps right away.
    private func findRegexpShortcut(pattern: String) -> String? {
        // strip backslashes
        var mask = String(pattern.dropFirst(1).dropLast(1));

        if (mask.contains("?")) {
            // Do not mess with complex expressions which use lookahead
            // And with those using ? special character: https://github.com/AdguardTeam/AdguardBrowserExtension/issues/978
            return nil;
        }

        // placeholder for a special character
        let specialCharacter = "...";

        // (Dirty) prepend specialCharacter for the following replace calls to work properly
        mask = specialCharacter + mask;

        // Strip all types of brackets
        if let regex = try? NSRegularExpression(pattern: "[^\\\\]\\(.*[^\\\\]\\)", options: .caseInsensitive) {
            mask = regex.stringByReplacingMatches(in: mask, options: [], range: NSRange(location: 0, length:  mask.count), withTemplate: specialCharacter)
        }
        if let regex = try? NSRegularExpression(pattern: "[^\\\\]\\[.*[^\\\\]\\]", options: .caseInsensitive) {
            mask = regex.stringByReplacingMatches(in: mask, options: [], range: NSRange(location: 0, length:  mask.count), withTemplate: specialCharacter)
        }
        if let regex = try? NSRegularExpression(pattern: "[^\\\\]\\{.*[^\\\\]\\}", options: .caseInsensitive) {
            mask = regex.stringByReplacingMatches(in: mask, options: [], range: NSRange(location: 0, length:  mask.count), withTemplate: specialCharacter)
        }

        // Strip some special characters (\n, \t etc)
        if let regex = try? NSRegularExpression(pattern: "[^\\\\]\\\\[a-zA-Z]", options: .caseInsensitive) {
            mask = regex.stringByReplacingMatches(in: mask, options: [], range: NSRange(location: 0, length:  mask.count), withTemplate: specialCharacter)
        }

        var longest = "";
        let parts = mask.components(separatedBy: ["*", ".", "^", "|", "+", "?", "$", "[", "]", "(", ")", "{", "}"]);
        for part in parts {
            if (part.count > longest.count) {
                longest = part;
            }
        }

        return longest != "" ? longest.lowercased() : nil;
    }

    // Searches for the longest substring of the pattern that
    // does not contain any special characters: *,^,|.
    private func findShortcut(pattern: String) -> String? {
        var longest = "";
        let parts = pattern.components(separatedBy: ["*", "^", "|"]);
        for part in parts {
            if (part.count > longest.count) {
                longest = part;
            }
        }

        return longest != "" ? longest.lowercased() : nil;
    }

    // Returns scripts and css wrapper object for current url
    func getData(url: URL) throws -> Any {
        let blockerData = BlockerData();

        // Check lookup tables
        var selectedIndexes = networkEngine.lookupRules(url: url);
        selectedIndexes.sort();

        // Get entries for indexes
        var selectedEntries: Array<BlockerEntry> = [];
        for i in selectedIndexes {
            selectedEntries.append(blockerEntries[i]);
        }

        // Iterate reversed to apply actions or ignore next rules
        for i in (0 ..< selectedEntries.count).reversed() {
            var entry = selectedEntries[i];
            if (isEntryTriggered(trigger: &entry.trigger, url: url)) {
                if entry.action.type == "ignore-previous-rules" {
                    return blockerData;
                } else {
                    addActionContent(blockerData: blockerData, blockerEntry: entry);
                }
            }
        }

        return blockerData;
    }

    // Checks if trigger content is suitable for current url
    private func isEntryTriggered(trigger: inout BlockerEntry.Trigger, url: URL) -> Bool {
        let host = url.host;
        let absoluteUrl = url.absoluteString;

        if trigger.urlFilter != nil && trigger.urlFilter != "" {
            if trigger.shortcut != nil && !absoluteUrl.lowercased().contains(trigger.shortcut) {
                return false;
            }

            if (host == nil || !checkDomains(trigger: trigger, host: host!)) {
                return false;
            }

            return matchesUrlFilter(text: absoluteUrl, trigger: &trigger);
        } else {
            // Pass empty url-filter
        }

        return false;
    }

    // Checks if trigger domain's fields matches current host
    private func checkDomains(trigger: BlockerEntry.Trigger, host: String) -> Bool {
        let permittedDomains = trigger.ifDomain;
        let restrictedDomains = trigger.unlessDomain;

        let permittedDomainsEmpty = permittedDomains == nil || permittedDomains!.isEmpty;
        let restrictedDomainsEmpty = restrictedDomains == nil || restrictedDomains!.isEmpty;

        if permittedDomainsEmpty && restrictedDomainsEmpty {
            return true;
        }

        if !restrictedDomainsEmpty && permittedDomainsEmpty {
            return !matchesDomains(domainPatterns: restrictedDomains!, domain: host);
        }

        if restrictedDomainsEmpty && !permittedDomainsEmpty {
            return matchesDomains(domainPatterns: permittedDomains!, domain: host);
        }

        return matchesDomains(domainPatterns: permittedDomains!, domain: host) && !matchesDomains(domainPatterns: restrictedDomains!, domain: host);
    }

    // Checks if domain matches at least one domain pattern
    private func matchesDomains(domainPatterns: [String], domain: String) -> Bool {
        for pattern in domainPatterns {
            if domain == pattern {
                return true;
            }

            // If pattern starts with '*' - it matches sub domains
            if (!pattern.isEmpty
                && domain.hasSuffix(String(pattern.dropFirst(1)))
                && pattern.hasPrefix("*")) {
                return true;
            }
        }

        return false;
    }

    // Checks if text matches specified trigger
    // Checks url-filter or cached regexp
    private func matchesUrlFilter(text: String, trigger: inout BlockerEntry.Trigger) -> Bool {
        let pattern = trigger.urlFilter;
        if (pattern == ".*" || pattern == "^[htpsw]+:\\/\\/") {
            return true;
        }

        if (trigger.regex == nil) {
            let regex = try? NSRegularExpression(pattern: pattern!, options: []);
            trigger.setRegex(regex: regex);
        }

        if (trigger.regex == nil) {
            return text.range(of: pattern!, options: .regularExpression, range: nil, locale: nil) != nil;
        } else {
            let numberOfMatches = trigger.regex!.numberOfMatches(in: text, range: NSRange(text.startIndex..., in: text));
            return numberOfMatches > 0;
        }
    }

    // Adds scripts or css to blocker data object
    private func addActionContent(blockerData: BlockerData, blockerEntry: BlockerEntry) {
        if blockerEntry.action.type == "css" {
            blockerData.addCss(style: blockerEntry.action.css);
        } else if blockerEntry.action.type == "script" {
            blockerData.addScript(script: blockerEntry.action.script);
        } else if blockerEntry.action.type == "scriptlet" {
            blockerData.addScriptlet(scriptlet: blockerEntry.action.scriptletParam);
        }
    }

    // Parses json to objects array
    private func parseJsonString(json: String) throws -> Array<BlockerEntry> {
        let data = json.data(using: String.Encoding.utf8, allowLossyConversion: false)!

        let decoder = JSONDecoder();
        let parsedData = try decoder.decode([BlockerEntry].self, from: data);

        return parsedData;
    }
}
