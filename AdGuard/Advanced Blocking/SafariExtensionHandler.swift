//
//  SafariExtensionHandler.swift
//  Advanced Blocking
//
//  Created by Dimitry Kolyshev on 28.01.2019.
//  Copyright © 2019 Adguard Software Ltd. All rights reserved.
//

import SafariServices

class SafariExtensionHandler: SFSafariExtensionHandler {
    
    // TODO: Move to initialize method?
    private var contentBlockerController: ContentBlockerController = ContentBlockerController();
    
    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String : Any]?) {
        page.getPropertiesWithCompletionHandler { properties in
            NSLog("The extension received a message (\(messageName)) from a script injected into (\(String(describing: properties?.url))) with userInfo (\(userInfo ?? [:]))")
            
            // Content script requests scripts and css for current page
            if (messageName == "getAdvancedBlockingData") {
                let data: [String : Any]? = ["data": self.contentBlockerController.getData(url: properties?.url)];
                page.dispatchMessageToScript(withName: "advancedBlockingData", userInfo: data);
            }
        }
    }
    
    override func toolbarItemClicked(in window: SFSafariWindow) {
        // This method will be called when your toolbar item is clicked.
        NSLog("The extension's toolbar item was clicked")
    }
    
    override func validateToolbarItem(in window: SFSafariWindow, validationHandler: @escaping ((Bool, String) -> Void)) {
        // This is called when Safari's state changed in some way that would require the extension's toolbar item to be validated again.
        validationHandler(true, "")
    }
    
    override func popoverViewController() -> SFSafariExtensionViewController {
        return SafariExtensionViewController.shared
    }

}
