//
//  AdvancedBlockingTests.swift
//  AdvancedBlockingTests
//
//  Created by Dimitry Kolyshev on 30.01.2019.
//  Copyright © 2020 AdGuard Software Ltd. All rights reserved.
//

import XCTest

@testable import AdGuardForSafariExtension;

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
                        "type": "css-extended",
                        "css": "#included-css:has(div) { height: 5px; }"
                    }
                },
                {
                    "trigger": {
                        "url-filter": ".*"
                    },
                    "action": {
                        "type": "scriptlet",
                        "scriptlet": "abp-hide-if-contains",
                        "scriptletParam": "{\\"name\\":\\"abort-on-property-read\\",\\"args\\":[\\"I10C\\"]}"
                    }
                }
            ]
        """;

        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        let data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")!) as! BlockerData;

        XCTAssert(data.scripts[0] == "included-script");
        XCTAssert(data.cssExtended[0] == "#included-css:has(div) { height: 5px; }");
        XCTAssert(data.scriptlets[0] == "{\"name\":\"abort-on-property-read\",\"args\":[\"I10C\"]}");
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
                        "type": "css-extended",
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
        let data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")!) as! BlockerData;

        XCTAssert(data.scripts[0] == "included-script");
        XCTAssert(data.cssExtended[0] == "#included-css:has(div) { height: 5px; }");
        XCTAssert(data.scriptlets.count == 0);
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
                        "type": "css-extended",
                        "css": "#excluded-css:has(div) { height: 5px; }"
                    }
                }
            ]
        """;

        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        let data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")!) as! BlockerData;

        XCTAssert(data.scripts[0] == "included-script");
        XCTAssert(data.cssExtended.count == 0);
        XCTAssert(data.scriptlets.count == 0);
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
                        "type": "css-extended",
                        "css": "#excluded-css:has(div) { height: 5px; }"
                    }
                }
            ]
        """;

        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        let data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")!) as! BlockerData;

        XCTAssert(data.scripts[0] == "included-script");
        XCTAssert(data.cssExtended.count == 0);
        XCTAssert(data.scriptlets.count == 0);
    }

    func testUrlFilterIfSubDomain() {
        let contentBlockerJsonString = """
            [
                {
                    "trigger": {
                        "url-filter": "^[htpsw]+:\\/\\/",
                        "if-domain": [
                            "*example.com"
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
                        "type": "css-extended",
                        "css": "#excluded-css:has(div) { height: 5px; }"
                    }
                }
            ]
        """;

        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        let data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://sub.example.com")!) as! BlockerData;

        XCTAssert(data.scripts[0] == "included-script");
        XCTAssert(data.cssExtended.count == 0);
        XCTAssert(data.scriptlets.count == 0);
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
                        "type": "css-extended",
                        "css": "#included-css:has(div) { height: 5px; }"
                    }
                }
            ]
        """;

        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        let data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")!) as! BlockerData;

        XCTAssert(data.scripts.count == 0);
        XCTAssert(data.cssExtended[0] == "#included-css:has(div) { height: 5px; }");
        XCTAssert(data.scriptlets.count == 0);
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
        var data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")!) as! BlockerData;

        XCTAssert(data.scripts[0] == "included-script");
        XCTAssert(data.cssExtended.count == 0);
        XCTAssert(data.scriptlets.count == 0);

        data = try! contentBlockerContainer.getData(url: URL(string:"http://test.com")!) as! BlockerData;

        XCTAssert(data.scripts[0] == "included-script");
        XCTAssert(data.scripts[1] == "example-ignored-script");
        XCTAssert(data.cssExtended.count == 0);
        XCTAssert(data.scriptlets.count == 0);
    }

    func testIgnorePreviousRulesExtended() {
        let contentBlockerJsonString = """
            [{
                "trigger": {"url-filter": ".*", "if-domain": ["*example-more.com", "*example.org"]},
                "action": {"type": "script", "script": "alert(1);"}
            }, {
                "trigger": {"url-filter": "^[htpsw]+:\\/\\/", "if-domain": ["*example.org"]},
                "action": {"type": "ignore-previous-rules"}
            }, {
                "trigger": {"url-filter": "^[htpsw]+:\\/\\/", "if-domain": ["*example.org"]},
                "action": {"type": "ignore-previous-rules"}
            }]
        """;

        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        var data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.org")!) as! BlockerData;

        XCTAssert(data.scripts.count == 0);
        XCTAssert(data.cssExtended.count == 0);
        XCTAssert(data.scriptlets.count == 0);

        data = try! contentBlockerContainer.getData(url: URL(string:"http://example-more.com")!) as! BlockerData;

        XCTAssert(data.scripts[0] == "alert(1);");
        XCTAssert(data.cssInject.count == 0);
        XCTAssert(data.scriptlets.count == 0);
    }
    
    func testIgnorePreviousRulesScripts() {
        let contentBlockerJsonString = """
        [
            {
                "trigger":
                {
                    "url-filter":".*",
                    "if-domain":["*example.com"]
                },
                "action":{"type":"script","script":"alert(1);"}
            },
            {
                "trigger":
                {
                    "url-filter":".*",
                    "if-domain":["*example.com"],
                    "resource-type":["document"]
                },
                "action":{"type":"ignore-previous-rules"}
            }
        ]
        """;
        
        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        var data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")!) as! BlockerData;

        XCTAssert(data.scripts.count == 0);
        XCTAssert(data.cssExtended.count == 0);
        XCTAssert(data.scriptlets.count == 0);
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
        let data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://test.ru")!) as! BlockerData;

        XCTAssert(data.scripts[0] == "test-included-script");
    }

    func testInvalidItems() {
        // Invalid trigger
        var contentBlockerJsonString = """
            [
                {
                    "trigger": {
                    },
                    "action": {
                        "type": "script",
                        "script": "some-script"
                    }
                }
            ]
        """;

        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        var data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://test.ru")!) as! BlockerData;

        XCTAssert(data.scripts.count == 0);
        XCTAssert(data.cssExtended.count == 0);
        XCTAssert(data.scriptlets.count == 0);

        // Unsupported action
        contentBlockerJsonString = """
            [
                {
                    "trigger": {
                        "url-filter": ".*"
                    },
                    "action": {
                        "type": "unsupported",
                        "script": "some-script"
                    }
                }
            ]
        """;

        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        data = try! contentBlockerContainer.getData(url: URL(string:"http://test.ru")!) as! BlockerData;

        XCTAssert(data.scripts.count == 0);
        XCTAssert(data.cssExtended.count == 0);
        XCTAssert(data.scriptlets.count == 0);

        // Invalid action
        contentBlockerJsonString = """
            [
                {
                    "trigger": {
                        "url-filter": ".*"
                    },
                    "action": {
                        "type": "script"
                    }
                }
            ]
        """;

        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        data = try! contentBlockerContainer.getData(url: URL(string:"http://test.ru")!) as! BlockerData;

        XCTAssert(data.scripts.count == 0);
        XCTAssert(data.cssExtended.count == 0);
        XCTAssert(data.scriptlets.count == 0);

        // Invalid regexp
        contentBlockerJsonString = """
            [
                {
                    "trigger": {
                        "url-filter": "t{1}est.ru{a)$"
                    },
                    "action": {
                        "type": "script",
                        "script": "some-script"
                    }
                }
            ]
        """;

        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
        data = try! contentBlockerContainer.getData(url: URL(string:"http://test.ru")!) as! BlockerData;

        XCTAssert(data.scripts.count == 0);
        XCTAssert(data.cssExtended.count == 0);
        XCTAssert(data.scriptlets.count == 0);
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
                        "type": "css-extended",
                        "css": "#excluded-css:has(div) { height: 5px; }"
                    }
                }
            ]
        """;

            try! contentBlockerContainer.setJson(json: contentBlockerJsonString);
            let data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")!) as! BlockerData;

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
                            "type": "css-extended",
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
                    "type": "css-extended",
                    "css": "#excluded-css:has(div) { height: 5px; }"
                }
            }
            """;
        }

        contentBlockerJsonString += "]";

        try! contentBlockerContainer.setJson(json: contentBlockerJsonString);

        self.measure {
            for _ in 1...3 {
                let data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")!) as! BlockerData;

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
                let data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://example.com")!) as! BlockerData;

                XCTAssert(data.scripts[0] == "included-script");
            }
        }

    }

    // Base + Russian filters
    func testPerformanceCommonFilter() {
        let bundle = Bundle(for: type(of:self));
        let path = bundle.path(forResource: "adv-blocking-content-rules", ofType: "json");

        let content = try! String(contentsOfFile: path!, encoding: String.Encoding.utf8);

        try! contentBlockerContainer.setJson(json: content);

        // Average time 0.125
        self.measure {
            for _ in 1...10 {
                let data: BlockerData = try! contentBlockerContainer.getData(url: URL(string:"http://mail.ru")!) as! BlockerData;

                XCTAssert(data.scripts.count == 11);
                XCTAssert(data.cssExtended.count == 0);
                XCTAssert(data.scriptlets.count == 0);
            }
        }

    }

    // Base + Russian filters on top sites
    func testPerformanceTopSitesFilter() {
        let bundle = Bundle(for: type(of:self));
        let path = bundle.path(forResource: "adv-blocking-content-rules", ofType: "json");
        let topSitesPath = bundle.path(forResource: "top-sites", ofType: "txt");

        let content = try! String(contentsOfFile: path!, encoding: String.Encoding.utf8);

        try! contentBlockerContainer.setJson(json: content);

        let topSites = try! String(contentsOfFile: topSitesPath!, encoding: String.Encoding.utf8);
        let topSitesArr = topSites.split(separator: "\n");

        // Average time 0.175
        self.measure {
            for site in topSitesArr {
                let url = "http://" + site;
                let data = try! contentBlockerContainer.getData(url: URL(string: url)!) as! BlockerData;
                XCTAssert(data.scripts.count >= 0);
            }
        }

    }

}
