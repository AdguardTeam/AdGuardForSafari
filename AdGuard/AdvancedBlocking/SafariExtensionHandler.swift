//
//  SafariExtensionHandler.swift
//  AdvancedBlocking
//
//  Created by Dimitry Kolyshev on 30.01.2019.
//  Copyright © 2019 Adguard Software Ltd. All rights reserved.
//

import SafariServices

class SafariExtensionHandler: SFSafariExtensionHandler {
    
    private var contentBlockerController: ContentBlockerController = ContentBlockerController();
    
    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String : Any]?) {
        // This method will be called when a content script provided by your extension calls safari.extension.dispatchMessage("message").
        page.getPropertiesWithCompletionHandler { properties in
            NSLog("The extension received a message (\(messageName)) from a script injected into (\(String(describing: properties?.url))) with userInfo (\(userInfo ?? [:]))")
            
            // Content script requests scripts and css for current page
            if (messageName == "getAdvancedBlockingData") {
                do {
                    let data: [String : Any]? = ["data": try self.contentBlockerController.getData(url: properties?.url)];
                    page.dispatchMessageToScript(withName: "advancedBlockingData", userInfo: data);
                } catch {
                    NSLog("Error handling message (\(messageName)) from a script injected into (\(String(describing: properties?.url))) with userInfo (\(userInfo ?? [:])): \(error)");
                }
            }
        }
    }
}
