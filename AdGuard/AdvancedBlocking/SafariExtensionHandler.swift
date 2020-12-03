//
//  SafariExtensionHandler.swift
//  AdvancedBlocking
//
//  Created by Dimitry Kolyshev on 30.01.2019.
//  Copyright © 2020 AdGuard Software Ltd. All rights reserved.
//

import SafariServices

class SafariExtensionHandler: SFSafariExtensionHandler {

    private var contentBlockerController: ContentBlockerController? = nil;

    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String : Any]?) {
        // This method will be called when a content script provided by your extension calls safari.extension.dispatchMessage("message").

        if (self.contentBlockerController == nil) {
            self.contentBlockerController = ContentBlockerController.shared;
        }
        
        NSLog("AG: The extension received a message (\(messageName)) with userInfo (\(userInfo ?? [:]))");
        
        // Content script requests scripts and css for current page
        if (messageName == "getAdvancedBlockingData") {
            do {
                if (userInfo == nil || userInfo!["url"] == nil) {
                    return;
                }

                let url = userInfo!["url"] as! String;
                
                let data: [String : Any]? = [
                    "data": try self.contentBlockerController!.getData(url: URL(string: url)!),
                    "verbose": self.isVerboseLoggingEnabled()
                ];
                page.dispatchMessageToScript(withName: "advancedBlockingData", userInfo: data);
            } catch {
                AESharedResources.ddLogError("AG: Error handling message (\(messageName)) with userInfo (\(userInfo ?? [:])): \(error)");
            }
        }
    }

    // Returns true if verbose logging setting is enabled
    private func isVerboseLoggingEnabled() -> Bool {
        return AESharedResources.sharedDefaults.bool(forKey: AEDefaultsVerboseLogging);
    }
}
