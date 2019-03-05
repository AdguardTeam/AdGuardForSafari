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
    
    var contentBlockerContainer: ContentBlockerContainer = ContentBlockerContainer();
    
    override func setUp() {
        //contentBlockerContainer = ContentBlockerContainer();
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }
    
    func testSimple() {
        let contentBlockerJsonString = """
            [
                {
                    "trigger": {
                        "url-filter": ".*"
                    },
                    "action": {
                        "type": "script",
                        "script": "included-script"
                    }
                },
                {
                    "trigger": {
                        "url-filter": ".*"
                    },
                    "action": {
                        "type": "css",
                        "css": "#included-css:has(div) { height: 5px; }"
                    }
                }
            ]
        """;
        
        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        let data: ContentBlockerContainer.BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")) as! ContentBlockerContainer.BlockerData;
        
        XCTAssert(data.scripts[0] == "included-script");
        XCTAssert(data.css[0] == "#included-css:has(div) { height: 5px; }");
    }
    
    func testTriggerUrlFilterAll() {
        let contentBlockerJsonString = """
            [
                {
                    "trigger": {
                        "url-filter": ".*"
                    },
                    "action": {
                        "type": "script",
                        "script": "included-script"
                    }
                },
                {
                    "trigger": {
                        "url-filter": ".*"
                    },
                    "action": {
                        "type": "css",
                        "css": "#included-css:has(div) { height: 5px; }"
                    }
                },
                {
                    "trigger": {
                        "url-filter": "test.com"
                    },
                    "action": {
                        "type": "css",
                        "css": "#excluded-css:has(div) { height: 5px; }"
                    }
                }
            ]
        """;
        
        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        let data: ContentBlockerContainer.BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")) as! ContentBlockerContainer.BlockerData;
        
        XCTAssert(data.scripts[0] == "included-script");
        XCTAssert(data.css[0] == "#included-css:has(div) { height: 5px; }");
    }
    
    func testTriggerUrlFilter() {
        let contentBlockerJsonString = """
            [
                {
                    "trigger": {
                        "url-filter": "example.com"
                    },
                    "action": {
                        "type": "script",
                        "script": "included-script"
                    }
                },
                {
                    "trigger": {
                        "url-filter": "not-example.com"
                    },
                    "action": {
                        "type": "css",
                        "css": "#excluded-css:has(div) { height: 5px; }"
                    }
                }
            ]
        """;
        
        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        let data: ContentBlockerContainer.BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")) as! ContentBlockerContainer.BlockerData;
        
        XCTAssert(data.scripts[0] == "included-script");
        XCTAssert(data.css.count == 0);
    }
    
    func testUrlFilterIfDomain() {
        let contentBlockerJsonString = """
            [
                {
                    "trigger": {
                        "url-filter": "^[htpsw]+:\\/\\/",
                        "if-domain": [
                            "example.com"
                        ]
                    },
                    "action": {
                        "type": "script",
                        "script": "included-script"
                    }
                },
                {
                    "trigger": {
                        "url-filter": "^[htpsw]+:\\/\\/",
                        "if-domain": [
                            "not-example.com"
                        ]
                    },
                    "action": {
                        "type": "css",
                        "css": "#excluded-css:has(div) { height: 5px; }"
                    }
                }
            ]
        """;
        
        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        let data: ContentBlockerContainer.BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")) as! ContentBlockerContainer.BlockerData;
        
        XCTAssert(data.scripts[0] == "included-script");
        XCTAssert(data.css.count == 0);
    }
    
    func testUrlFilterUnlessDomain() {
        let contentBlockerJsonString = """
            [
                {
                    "trigger": {
                        "url-filter": ".*",
                        "unless-domain": [
                            "example.com",
                            "test.com"
                        ]
                    },
                    "action": {
                        "type": "script",
                        "script": "excluded-script"
                    }
                },
                {
                    "trigger": {
                        "url-filter": ".*"
                    },
                    "action": {
                        "type": "css",
                        "css": "#included-css:has(div) { height: 5px; }"
                    }
                }
            ]
        """;
        
        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        let data: ContentBlockerContainer.BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")) as! ContentBlockerContainer.BlockerData;
        
        XCTAssert(data.scripts.count == 0);
        XCTAssert(data.css[0] == "#included-css:has(div) { height: 5px; }");
    }
    
    func testIgnorePreviousRules() {
        let contentBlockerJsonString = """
            [
                {
                    "trigger": {
                        "url-filter": ".*"
                    },
                    "action": {
                        "type": "script",
                        "script": "example-ignored-script"
                    }
                },
                {
                    "trigger": {
                        "url-filter": ".*",
                        "if-domain": [
                            "example.com"
                        ]
                    },
                    "action": {
                        "type": "ignore-previous-rules"
                    }
                },
                {
                    "trigger": {
                        "url-filter": ".*"
                    },
                    "action": {
                        "type": "script",
                        "script": "included-script"
                    }
                }
            ]
        """;
        
        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        var data: ContentBlockerContainer.BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")) as! ContentBlockerContainer.BlockerData;
        
        XCTAssert(data.scripts[0] == "included-script");
        XCTAssert(data.css.count == 0);
        
        data = try! contentBlockerContainer.getData(url: URL(string:"http://test.com")) as! ContentBlockerContainer.BlockerData;
        
        XCTAssert(data.scripts[0] == "example-ignored-script");
        XCTAssert(data.scripts[1] == "included-script");
        XCTAssert(data.css.count == 0);
    }
    
    func testUrlFilterShortcuts() {
        let contentBlockerJsonString = """
            [
                {
                    "trigger": {
                        "url-filter": "/YanAds/"
                    },
                    "action": {
                        "type": "script",
                        "script": "excluded-script"
                    }
                },
                {
                    "trigger": {
                        "url-filter": "/cdsbData_gal/bannerFile/"
                    },
                    "action": {
                        "type": "script",
                        "script": "excluded-script"
                    }
                },
                {
                    "trigger": {
                        "url-filter": "test.ru"
                    },
                    "action": {
                        "type": "script",
                        "script": "test-included-script"
                    }
                }
            ]
        """;
        
        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        let data: ContentBlockerContainer.BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://test.ru")) as! ContentBlockerContainer.BlockerData;
        
        XCTAssert(data.scripts[0] == "test-included-script");
    }
    
    func testPerformanceEmptyList() {
        self.measure {
            let contentBlockerJsonString = """
            [
                {
                    "trigger": {
                        "url-filter": "^[htpsw]+:\\/\\/",
                        "if-domain": [
                            "example.com"
                        ]
                    },
                    "action": {
                        "type": "script",
                        "script": "included-script"
                    }
                },
                {
                    "trigger": {
                        "url-filter": "^[htpsw]+:\\/\\/",
                        "if-domain": [
                            "not-example.com"
                        ]
                    },
                    "action": {
                        "type": "css",
                        "css": "#excluded-css:has(div) { height: 5px; }"
                    }
                }
            ]
        """;
            
            try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
            let data: ContentBlockerContainer.BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")) as! ContentBlockerContainer.BlockerData;
            
            XCTAssert(data.scripts[0] == "included-script");
        }
    }
    
    func testPerformanceLongList() {
        var contentBlockerJsonString = """
                [
                    {
                        "trigger": {
                            "url-filter": "^[htpsw]+:\\/\\/",
                            "if-domain": [
                                "example.com"
                            ]
                        },
                        "action": {
                            "type": "script",
                            "script": "included-script"
                        }
                    },
                    {
                        "trigger": {
                            "url-filter": "^[htpsw]+:\\/\\/",
                            "if-domain": [
                                "not-example.com"
                            ]
                        },
                        "action": {
                            "type": "css",
                            "css": "#excluded-css:has(div) { height: 5px; }"
                        }
                    }
            """;
        
        for index in 1...5000 {
            contentBlockerJsonString += """
            ,{
                "trigger": {
                    "url-filter": "^[htpsw]+:\\/\\/",
                    "if-domain": [
                        "not-example-\(index).com"
                        ]
                },
                "action": {
                    "type": "css",
                    "css": "#excluded-css:has(div) { height: 5px; }"
                }
            }
            """;
        }
        
        contentBlockerJsonString += "]";
        
        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        
        self.measure {
            for _ in 1...3 {
                let data: ContentBlockerContainer.BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")) as! ContentBlockerContainer.BlockerData;
                
                XCTAssert(data.scripts[0] == "included-script");
            }
        }
        
    }
    
    func testPerformanceUrlShortcutsLongList() {
        var contentBlockerJsonString = """
                [
                    {
                        "trigger": {
                            "url-filter": "example.com"
                        },
                        "action": {
                            "type": "script",
                            "script": "included-script"
                        }
                    },
                    {
                        "trigger": {
                            "url-filter": "not-example.com"
                        },
                        "action": {
                            "type": "script",
                            "script": "excluded-script"
                        }
                    }
            """;
        
        for index in 1...5000 {
            contentBlockerJsonString += """
            ,{
                "trigger": {
                    "url-filter": "not-example-\(index).com"
                },
                "action": {
                    "type": "script",
                    "script": "excluded-script"
                }
            }
            """;
        }
        
        contentBlockerJsonString += "]";
        
        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        
        self.measure {
            for _ in 1...3 {
                let data: ContentBlockerContainer.BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")) as! ContentBlockerContainer.BlockerData;
                
                XCTAssert(data.scripts[0] == "included-script");
            }
        }
        
    }
    
}
