//
//  ContentBlockerContainer.swift
//  AdvancedBlocking
//
//  Created by Dimitry Kolyshev on 30.01.2019.
//  Copyright © 2019 Adguard Software Ltd. All rights reserved.
//

import Foundation

// Storage and parser
// TODO: Add unit tests
class ContentBlockerContainer {
    private var contentBlockerJson: Any;
    
    init() {
        contentBlockerJson = "";
    }
    
    func setJson(json: String) {
        // Parse "content-blocker" json
        contentBlockerJson = parseJsonString(json: json);
    }
    
    func getData(url: URL?) -> Any {
        //TODO: Select data for current url
        //TODO: Add cache
        
        return contentBlockerJson;
    }
    
    private func parseJsonString(json: String) -> Any {
        //TODO: Parse json to object
        
        return "parsed";
    }
}
