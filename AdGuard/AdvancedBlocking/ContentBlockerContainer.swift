//
//  ContentBlockerContainer.swift
//  AdvancedBlocking
//
//  Created by Dimitry Kolyshev on 30.01.2019.
//  Copyright © 2019 Adguard Software Ltd. All rights reserved.
//

import Foundation

// Storage and parser
class ContentBlockerContainer {
    private var contentBlockerJson: Array<BlockerEntry>;
    
    // Constructor
    init() {
        contentBlockerJson = [];
    }
    
    // Parses and saves json
    func setJson(json: String) throws {
        // Parse "content-blocker" json
        contentBlockerJson = try parseJsonString(json: json);
        // Parse shortcuts
        for i in 0 ..< contentBlockerJson.count {
            contentBlockerJson[i].trigger.setShortcut(shortcutValue: parseShortcut(urlMask: contentBlockerJson[i].trigger.urlFilter));
        }
    }
    
    // Parses url shortcuts
    private func parseShortcut(urlMask: String?) -> String? {
        // Skip empty string
        if urlMask == nil || urlMask == "" {
            return nil;
        }
        
        // Skip all url templates
        if urlMask == ".*" || urlMask == "^[htpsw]+://" {
            return nil;
        }
        
        var longest = "";
        let parts = urlMask!.components(separatedBy: ["*", "^", "|", "+", "?", "$", "[", "]", "(", ")", "{", "}"]);
        for part in parts {
            if (part.count > longest.count) {
                longest = part;
            }
        }
        
        return longest != "" ? longest.lowercased() : nil;
    }
    
    // Returns scripts and css wrapper object for current url
    func getData(url: URL?) throws -> Any {
        let blockerData = BlockerData();
        for entry in contentBlockerJson.reversed() {
            if isEntryTriggered(trigger: entry.trigger, url: url) {
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
    private func isEntryTriggered(trigger: BlockerEntry.Trigger, url: URL?) -> Bool {
        if url == nil {
            return true;
        }
        
        let host = url!.host;
        let absoluteUrl = url!.absoluteString;
        
        if trigger.urlFilter != nil && trigger.urlFilter != "" {
            if trigger.shortcut != nil && !absoluteUrl.lowercased().contains(trigger.shortcut) {
                return false;
            }
            
            if !matchesPattern(text: absoluteUrl, pattern: trigger.urlFilter!) {
                return false;
            }
            
            return checkDomains(trigger: trigger, host: host!);
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
            if (pattern.count > 0
                && pattern.hasPrefix("*")
                && matchesPattern(text: domain, pattern: "." + pattern)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Checks if text matches regular expression
    private func matchesPattern(text: String, pattern: String) -> Bool {
        if pattern == ".*" || pattern == "^[htpsw]+://" {
            return true;
        }
        
        return text.range(of: pattern, options: .regularExpression, range: nil, locale: nil) != nil;
    }
    
    // Adds scripts or css to blocker data object
    private func addActionContent(blockerData: BlockerData, blockerEntry: BlockerEntry) {
        if blockerEntry.action.type == "css" {
            let style = blockerEntry.action.css ?? "";
            blockerData.addCss(style: style);
        } else if blockerEntry.action.type == "script" {
            let script = blockerEntry.action.script ?? "";
            blockerData.addScript(script: script);
        }
    }
    
    // Parses json to objects array
    private func parseJsonString(json: String) throws -> Array<BlockerEntry> {
        let data = json.data(using: String.Encoding.utf8, allowLossyConversion: false)!
        
        let decoder = JSONDecoder();
        let parsedData = try decoder.decode([BlockerEntry].self, from: data);
        
        return parsedData;
    }
    
    // Json decoded object description
    struct BlockerEntry: Codable {
        var trigger: Trigger
        let action: Action
        
        struct Trigger : Codable {
            let ifDomain: [String]?
            let urlFilter: String?
            var shortcut: String?
            let unlessDomain: [String]?
            
            enum CodingKeys: String, CodingKey {
                case ifDomain = "if-domain"
                case urlFilter = "url-filter"
                case unlessDomain = "unless-domain"
                case shortcut = "url-shortcut"
            }
            
            mutating func setShortcut(shortcutValue: String?) {
                self.shortcut = shortcutValue;
            }
        }
        
        struct Action : Codable {
            let type: String
            let css: String?
            let script: String?
        }
    }
    
    // Wrapper result class
    class BlockerData: Encodable {
        var scripts = [String]()
        var css = [String]()
        
        func addScript(script: String) {
            scripts.append(script);
        }
        
        func addCss(style: String) {
            css.append(style);
        }
        
        func clear() {
            scripts = [];
            css = [];
        }
    }
}
