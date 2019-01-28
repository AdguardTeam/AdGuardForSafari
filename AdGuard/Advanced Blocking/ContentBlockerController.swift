//
//  ContentBlockerController.swift
//  Advanced Blocking
//
//  Created by Dimitry Kolyshev on 28.01.2019.
//  Copyright © 2019 Adguard Software Ltd. All rights reserved.
//

import Foundation


// How it works:
// Electron stores rules and filters data, but in case electron in not running permanently - we need to store rules data here in extension. For transfering between electron and this extension application we choose some "content-blocker"-like json format. Electron manages to create it and keep up-to-date with user changes. Here we listen for electron messages and update existing local copy.
// This extension injects script to pages from there we handle messages requesting scripts and css to be applied to current page. These scripts and css are selected from saved local json data.

class ContentBlockerController {
    
    private var contentBlockerJson: String
    
    // Constructor
    init() {
        // TODO: Request content-blocker json from electron
        // TODO: Keep content-blocker json up-to-date
        
        // TODO: Parse "content-blocker" json
        
        contentBlockerJson = """
            [
                {
                    trigger: {
                        "if-domain": "example.com",
                    },
                    "action": {
                        "type": "script",
                        "script": "console.log('test injection script')"
                    }
                },
                {
                    trigger: {
                        "if-domain": "example.com",
                    },
                    {
                        "action": "css",
                        "css": "#banner:has(div) { height: 5px; }"
                    }
                }
            ]
        """;
        
    }
    
    // Returns requested scripts and css for specified url
    func getData(url: URL?) -> [String : Any]? {
        //TODO: Select data for current url
        
        return ["myKey": contentBlockerJson];
    }
}
