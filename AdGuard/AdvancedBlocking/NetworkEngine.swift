//
//  NetworkEngine.swift
//  AdvancedBlocking
//
//  Created by Dimitry Kolyshev on 29.06.2019.
//  Copyright © 2019 Adguard Software Ltd. All rights reserved.
//

import Foundation

// Builds lookup tables:
// 1. domain -> ruleIdx
// 2. shortcut hash -> ruleIdx
// 3. no shortcuts indexes list
class NetworkEngine {
    
    private var shortcutLength = 5;
    
    private var domainsLookupTable: [UInt32: Array<Int>];
    private var shortcutsLookupTable: [UInt32: Array<Int>];
    private var shortcutsHistogram: [UInt32: Int];
    private var otherRules: Array<Int>;

    // Constructor
    init() {
        domainsLookupTable = [UInt32: Array<Int>]();
        shortcutsLookupTable = [UInt32: Array<Int>]();
        shortcutsHistogram = [UInt32: Int]();
        otherRules = [];
    }
    
    // Adds rules to engine
    func addRules(entries: Array<BlockerEntry>) {
        for i in 0 ..< entries.count {
            addRule(entry: entries[i], index: i);
        }
    }
    
    // Looking for matches in lookup tables
    func lookupRules(url: URL) -> Array<Int> {
        let absoluteUrl = url.absoluteString;
        let host = url.host ?? "";

        // First check by shortcuts
        var result = matchShortcutsLookupTable(url: absoluteUrl);
        
        // Check domains lookup
        for index in matchDomainsLookupTable(host: host) {
            result.append(index);
        }
        
        // Add all other rules
        // TODO: We probably could check it here aswell
        for index in otherRules {
            //rule := n.otherRules[i]
            //if rule.Match(r) {
            result.append(index);
            //}
        }
        
        return result;
    }
    
    // matchDomainsLookupTable finds all matching rules from the domains lookup table
    private func matchDomainsLookupTable(host: String) -> Array<Int> {
        var result = Array<Int>();
        
        if (host == "") {
            return result
        }
    
        let domains = getSubdomains(hostname: host);
        for domain in domains {
            let hash = fastHash(str: domain);
            guard let rules = domainsLookupTable[hash] else {
                continue;
            }
            
            for ruleIdx in rules {
                //if rule != nil && rule.Match(r) {
                result.append(ruleIdx);
                //}
            }
        }
        return result;
    }
    
    private func getSubdomains(hostname: String) -> Array<String> {
        let parts = hostname.split(separator: ".");
        var subdomains = Array<String>();
        var domain = "";
        for part in parts.reversed() {
            if domain == "" {
                domain = String(part);
            } else {
                domain = part + "." + domain;
            }
            subdomains.append(domain);
        }
        
        return subdomains
    }
    
    // matchShortcutsLookupTable finds all matching rules from the shortcuts lookup table
    private func matchShortcutsLookupTable(url: String) -> Array<Int> {
        var result = Array<Int>();
        
        for i in 0 ..< (url.count - shortcutLength) {
            let hash = fastHashBetween(str: url, begin: i, end: i + shortcutLength);
            guard let rules = shortcutsLookupTable[hash] else {
                continue;
            }
            
            for ruleIdx in rules {
                //if rule != nil && rule.Match(r) {
                    result.append(ruleIdx);
                //}
            }
        }
        
        return result
    }
    
    // Adds rule to the network engine
    private func addRule(entry: BlockerEntry, index: Int) {
        if !addRuleToShortcutsTable(entry: entry, index: index) {
            if !addRuleToDomainsTable(entry: entry, index: index) {
                if !otherRules.contains(index) {
                    otherRules.append(index);
                }
            }
        }
    }
    
    private func addRuleToShortcutsTable(entry: BlockerEntry, index: Int) -> Bool {
        guard let shortcuts = getRuleShortcuts(entry: entry) else {
            return false;
        }
        
        if shortcuts.count == 0 {
            return false
        }
        
        // Find the applicable shortcut (the least used)
        var shortcutHash: UInt32 = 0;
        var minCount: Int = Int.max;
        for shortcutToCheck in shortcuts {
            let hash = fastHash(str: shortcutToCheck);
            var count = shortcutsHistogram[hash];
            if count == nil {
                count = 0;
            }
            
            if count! < minCount {
                minCount = count!;
                shortcutHash = hash;
            }
        }
        
        // Increment the histogram
        shortcutsHistogram[shortcutHash] = minCount + 1;
        
        // Add the rule to the lookup table
        var rulesIndexes = shortcutsLookupTable[shortcutHash];
        if (rulesIndexes == nil) {
            rulesIndexes = [];
        }
        
        rulesIndexes!.append(index);
        shortcutsLookupTable[shortcutHash] = rulesIndexes;
        
        return true;
    }
    
    // getRuleShortcuts returns a list of shortcuts that can be used for the lookup table
    private func getRuleShortcuts(entry: BlockerEntry) -> Array<String>? {
        guard let entryShortcut = entry.trigger.shortcut else {
            return nil;
        }
        
        if (entryShortcut.count < shortcutLength) {
            return nil;
        }
    
        if isAnyURLShortcut(shortcut: entryShortcut) {
            return nil;
        }
    
        var shortcuts: Array<String> = [];
        for i in 0 ..< (entryShortcut.count - shortcutLength + 1) {
            let start = entryShortcut.index(entryShortcut.startIndex, offsetBy: i);
            let end = entryShortcut.index(entryShortcut.startIndex, offsetBy: shortcutLength + i);
            let range = start..<end;
            
            let mySubstring = entryShortcut[range];
            let shortcut = String(mySubstring);
            shortcuts.append(shortcut);
        }
    
        return shortcuts;
    }
    
    // isAnyURLShortcut checks if the rule potentially matches too many URLs.
    // We'd better use another type of lookup table for this kind of rules.
    private func isAnyURLShortcut(shortcut: String) -> Bool {
        // Sorry for magic numbers
        // The numbers are basically ("PROTO://".length + 1)
        
        if shortcut.count < 6 && shortcut.starts(with: "ws:") {
            return true;
        }
        
        if shortcut.count < 7 && shortcut.starts(with: "|ws") {
            return true;
        }
        
        if shortcut.count < 9 && shortcut.starts(with: "http") {
            return true;
        }
        
        if shortcut.count < 10 && shortcut.starts(with: "|http") {
            return true;
        }
        
        return false;
    }
    
    private func addRuleToDomainsTable(entry: BlockerEntry, index: Int) -> Bool {
        let permittedDomains = entry.trigger.ifDomain;
        if (permittedDomains == nil || permittedDomains!.isEmpty) {
            return false;
        }
        
        for domain in permittedDomains! {
            var pattern = domain;
            if (domain.hasPrefix("*")) {
                pattern = String(domain.dropFirst());
            }
            
            let hash = fastHash(str: pattern);
            
            // Add the rule to the lookup table
            var rulesIndexes = domainsLookupTable[hash];
            if (rulesIndexes == nil) {
                rulesIndexes = [];
            }
            
            rulesIndexes!.append(index);
            domainsLookupTable[hash] = rulesIndexes;
        }
        
        return true;
    }
    
    // djb2 hash algorithm
    private func fastHashBetween(str: String, begin: Int, end: Int) -> UInt32 {
        var hash = UInt32(5381);
        for i in begin ..< end {
            let idx = str.index(str.startIndex, offsetBy: i);
            let character: UnicodeScalar = str.unicodeScalars[idx];
            let intValue = character.value;
            let uintValue = UInt32(intValue);
            hash = UInt32(hash) ^ uintValue;
        }
        
        return hash;
    }
    
    // djb2 hash algorithm
    private func fastHash(str: String) -> UInt32 {
        if str == "" {
            return 0;
        }
        
        return fastHashBetween(str: str, begin: 0, end: str.count);
    }
}
