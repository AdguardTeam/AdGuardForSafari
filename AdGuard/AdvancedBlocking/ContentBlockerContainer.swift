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
    func setJson(json: String) {
        // Parse "content-blocker" json
        contentBlockerJson = parseJsonString(json: json);
        
        //TODO: Add validation
    }
    
    // Returns scripts and css wrapper object for current url
    func getData(url: URL?) -> Any {
        //TODO: Add cache
        
        let blockerData = BlockerData();
        for entry in contentBlockerJson {
            if isEntryTriggered(trigger: entry.trigger, url: url) {
                addActionContent(blockerData: blockerData, blockerEntry: entry);
            }
        }
        
        return blockerData;
    }
    
    // Checks if trigger content is suitable for current url
    private func isEntryTriggered(trigger: BlockerEntry.Trigger, url: URL?) -> Bool {
        if trigger.urlFilter != "" {
            if trigger.urlFilter == ".*" {
                return true;
            }
            
            // TODO: Handle domains
        } else {
            // Pass empty url-filter
        }
        
        return false;
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
    private func parseJsonString(json: String) -> Array<BlockerEntry> {
        //TODO: Handle error
        
        let data = json.data(using: String.Encoding.utf8, allowLossyConversion: false)!
        
        let decoder = JSONDecoder();
        let parsedData = try! decoder.decode([BlockerEntry].self, from: data);
        
        return parsedData;
    }
    
    // Json decoded object description
    struct BlockerEntry: Codable {
        let trigger: Trigger
        let action: Action
        
        struct Trigger : Codable {
            let ifDomain: [String]?
            let urlFilter: String?
            let unlessDomain: [String]?
            
            enum CodingKeys: String, CodingKey {
                case ifDomain = "if-domain"
                case urlFilter = "url-filter"
                case unlessDomain = "unless-domain"
            }
        }
        
        struct Action : Codable {
            let type: String
            let css: String?
            let script: String?
        }
    }
    
    // Wrapper result object
    class BlockerData {
        var scripts: String = "";
        var css: String = "";
        
        func addScript(script: String) {
            scripts += script;
        }
        
        func addCss(style: String) {
            css += style;
        }
    }
}
