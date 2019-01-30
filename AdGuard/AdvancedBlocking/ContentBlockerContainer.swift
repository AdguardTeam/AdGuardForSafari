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
    private var contentBlockerJson: Array<Any>;
    
    init() {
        contentBlockerJson = [];
    }
    
    func setJson(json: String) {
        // Parse "content-blocker" json
        contentBlockerJson = parseJsonString(json: json);
        
        //TODO: Add validation
    }
    
    func getData(url: URL?) -> Any {
        //TODO: Select data for current url
        //TODO: Add cache
        
        return contentBlockerJson;
    }
    
    private func parseJsonString(json: String) -> Array<Any> {
        //TODO: Handle error
        
        let data = json.data(using: String.Encoding.utf8, allowLossyConversion: false)!
        
        let decoder = JSONDecoder();
        let parsedData = try! decoder.decode([BlockerEntry].self, from: data);
        
        return parsedData;
    }
    
    struct BlockerEntry: Codable {
        let trigger: [String: String]
        let action: [String:String]
    }
}
