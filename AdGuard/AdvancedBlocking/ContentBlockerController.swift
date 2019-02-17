//
//  ContentBlockerController.swift
//  AdvancedBlocking
//
//  Created by Dimitry Kolyshev on 30.01.2019.
//  Copyright © 2019 Adguard Software Ltd. All rights reserved.
//

import Foundation

// How it works:
// Electron stores rules and filters data, but in case electron in not running permanently - we need to store rules data in shared resources file. For transfering between electron and this extension application we choose some "content-blocker"-like json format. Electron manages to create it and keep up-to-date with user changes. Here we listen for electron messages and download updated copy from shared resources.
// This extension injects script to pages from there we handle messages requesting scripts and css to be applied to current page. These scripts and css are selected from saved local json data.

class ContentBlockerController {
    
    private var contentBlockerContainer: ContentBlockerContainer;
    
    // Constructor
    init() {
        contentBlockerContainer = ContentBlockerContainer();
        
        AESharedResources.setListenerOnAdvancedBlocking({
            NSLog("AG AdvancedBlocking json updated - download and setup new version");
            self.downloadJson();
        });
        
        downloadJson();
    }
    
    // Downloads and sets up json from shared resources
    func downloadJson() {
        let text = try! String(contentsOfFile: AESharedResources.advancedBlockingContentRulesUrlString()!, encoding: .utf8);
        NSLog("AG AdvancedBlocking: '\(text)'");
        self.contentBlockerContainer.setJson(json: text);
    }
    
    // Returns requested scripts and css for specified url
    func getData(url: URL?) -> String {
        let data: ContentBlockerContainer.BlockerData = contentBlockerContainer.getData(url: url) as! ContentBlockerContainer.BlockerData;
        
        let encoder = JSONEncoder();
        encoder.outputFormatting = .prettyPrinted
        
        let json = try! encoder.encode(data);
        return String(data: json, encoding: .utf8)!;
    }
}
