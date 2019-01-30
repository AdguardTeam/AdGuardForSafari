//
//  AdvancedBlockingTests.swift
//  AdvancedBlockingTests
//
//  Created by Dimitry Kolyshev on 30.01.2019.
//  Copyright © 2019 Adguard Software Ltd. All rights reserved.
//

import XCTest

@testable import AdvancedBlocking

class AdvancedBlockingTests: XCTestCase {
    
    override func setUp() {
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }
    
    func testExample() {
        // This is an example of a functional test case.
        // Use XCTAssert and related functions to verify your tests produce the correct results.
        
        let contentBlockerContainer: ContentBlockerContainer = ContentBlockerContainer();
        
        var contentBlockerJsonString = """
            [
                {
                    "trigger": {
                        "if-domain": "example.com"
                    },
                    "action": {
                        "type": "script",
                        "script": "console.log('test injection script')"
                    }
                },
                {
                    "trigger": {
                        "if-domain": "example.com"
                    },
                    "action": {
                        "type": "css",
                        "css": "#banner:has(div) { height: 5px; }"
                    }
                }
            ]
        """;
        
        //var contentBlockerJsonString = "[{\"testKey\":\"A\"},{\"testKey\":\"B\"}]";
        
        contentBlockerContainer.setJson(json: contentBlockerJsonString);
        
        var data = contentBlockerContainer.getData(url: URL(fileURLWithPath:"http://example.com"));
        XCTAssert(data != nil);
    }
    
    func testPerformanceExample() {
        // This is an example of a performance test case.
        self.measure {
            // Put the code you want to measure the time of here.
        }
    }
    
}
