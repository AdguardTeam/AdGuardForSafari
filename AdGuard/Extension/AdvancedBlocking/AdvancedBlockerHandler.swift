//
//  AdvancedBlockerHandler.swift
//
//  Copyright © 2020 AdGuard Software Ltd. All rights reserved.
//

import SafariServices

@objc
final class AdvancedBlockerHandler: NSObject {

    @objc
    static func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String : Any]?) {
        // This method will be called when a content script provided by your extension calls safari.extension.dispatchMessage("message").

        NSLog("AG: The extension received a message (%@)", messageName);

        // Content script requests scripts and css for current page
        if (messageName == "getAdvancedBlockingData") {
            do {
                if (userInfo == nil || userInfo!["url"] == nil) {
                    NSLog("AG: Empty url passed with the message");
                    return;
                }

                let url = userInfo?["url"] as? String ?? "";
                NSLog("AG: Page url: %@", url);

                let pageUrl = URL(string: url);
                if pageUrl == nil {
                    return;
                }
                

                let data: [String : Any]? = [
                    "url": url,
                    "data": try ContentBlockerController.shared.getData(url: pageUrl!),
                    "verbose": self.isVerboseLoggingEnabled()
                ];
                page.dispatchMessageToScript(withName: "advancedBlockingData", userInfo: data);
            } catch {
                AESharedResources.ddLogError("AG: Error handling message (\(messageName)): \(error)");
            }
        }
    }

    // Returns true if verbose logging setting is enabled
    static private func isVerboseLoggingEnabled() -> Bool {
        return AESharedResources.sharedDefaults.bool(forKey: AEDefaultsVerboseLogging);
    }
}
