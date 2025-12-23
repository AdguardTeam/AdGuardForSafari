// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

//
//  SafariExtensionStateServiceTests.TestCase.swift
//  AdguardMiniTests
//

// swiftlint:disable identifier_name

import Foundation

extension SafariExtensionStateServiceTests {
    typealias ManagerMockType = SafariExtensionStatusManagerMock.MockType
    typealias StorageMockType = SafariExtensionStateStorageMock.MockType
    typealias TestClasses = (
        stateService: SafariExtensionStateService,
        resultService: EventBusMock
    )

    struct TestState {
        let managerMock: ManagerMockType
        let isReloadSucceed: Bool
        let storageMock: StorageMockType
    }

    enum TestCase: CustomStringConvertible {
        case conversionSucceed(TestsStates)
        case conversionSucceedOverLimit(TestsStates)
        case conversionFailed(TestsStates)

        var description: String {
            switch self {
            case .conversionSucceed(let mocksStates):
                "conversionSucceed(\(mocksStates))"
            case .conversionSucceedOverLimit(let mocksStates):
                "conversionSucceedOverLimit(\(mocksStates))"
            case .conversionFailed(let mocksStates):
                "conversionFailed(\(mocksStates))"
            }
        }

        private var reloadError: Error {
            NSError(domain: "\(Self.self)", code: -1)
        }

        private struct ProcessStateResult {
            let status: SafariExtension.Status
            let state: SafariExtension.State
        }

        private func processConversion(
            _ conversionInfo: ConversionInfo,
            isFailed: Bool
        ) -> ProcessStateResult {
            if conversionInfo.overLimit {
                ProcessStateResult(status: .limitExceeded, state: .init(rulesInfo: conversionInfo))
            } else if isFailed {
                ProcessStateResult(
                    status: .converterError,
                    state: .init(rulesInfo: conversionInfo, error: .converterError)
                )
            } else {
                ProcessStateResult(status: .ok, state: .init(rulesInfo: conversionInfo))
            }
        }

        private func processState(
            _ conversionInfo: ConversionInfo,
            _ states: TestsStates,
            isConversionError: Bool,
            ignoreReloadStatus: Bool
        ) -> ProcessStateResult {
            let types = states.testState

            guard types.storageMock != .updateFailed else {
                let status: SafariExtension.Status = types.managerMock == .extNotEnabled ? .disabled : .unknown
                return ProcessStateResult(
                    status: status,
                    state: .init(rulesInfo: .invalid)
                )
            }

            return switch (types.managerMock, types.isReloadSucceed) {
            case (.extEnabled, true):
                self.processConversion(conversionInfo, isFailed: isConversionError)
            case (.extEnabled, false):
                if ignoreReloadStatus {
                    self.processConversion(conversionInfo, isFailed: isConversionError)
                } else {
                    ProcessStateResult(
                        status: .safariError,
                        state: .init(rulesInfo: conversionInfo, error: .safariError("\(self.reloadError)"))
                    )
                }
            case (.extNotEnabled, _):
                ProcessStateResult(
                    status: .disabled,
                    state: .init(rulesInfo: conversionInfo)
                )
            }
        }

        func createTestClasses() -> TestClasses {
            switch self {
            case
                    .conversionSucceed(let mocksStates),
                    .conversionFailed(let mocksStates),
                    .conversionSucceedOverLimit(let mocksStates):
                mocksStates.createTestClasses()
            }
        }

        func createConversionResult(blockerType: SafariBlockerType) -> SafariConversionResult {
            switch self {
            case .conversionSucceed:
                SafariConversionResult(
                    blockerType: blockerType,
                    conversionInfo: .success(.good)
                )
            case .conversionSucceedOverLimit:
                SafariConversionResult(
                    blockerType: blockerType,
                    conversionInfo: .success(.overLimit)
                )
            case .conversionFailed:
                SafariConversionResult(
                    blockerType: blockerType,
                    conversionInfo: .failure(.noData)
                )
            }
        }

        func createReloadResult(blockerType: SafariBlockerType) -> ReloadExtensionResult {
            switch self {
            case
                    .conversionSucceed(let mocksStates),
                    .conversionSucceedOverLimit(let mocksStates),
                    .conversionFailed(let mocksStates):
                if mocksStates.testState.isReloadSucceed {
                    ReloadExtensionResult(
                        blockerType: blockerType,
                        error: nil
                    )
                } else {
                    ReloadExtensionResult(
                        blockerType: blockerType,
                        error: self.reloadError
                    )
                }
            }
        }

        func createExpectedUpdate(
            _ blockerType: SafariBlockerType,
            ignoreReloadStatus: Bool = false
        ) -> CurrentExtensionState {
            let state: ProcessStateResult =
            switch self {
            case .conversionSucceed(let mockStates):
                self.processState(
                    .good,
                    mockStates,
                    isConversionError: false,
                    ignoreReloadStatus: ignoreReloadStatus
                )
            case .conversionSucceedOverLimit(let mockStates):
                self.processState(
                    .overLimit,
                    mockStates,
                    isConversionError: false,
                    ignoreReloadStatus: ignoreReloadStatus
                )
            case .conversionFailed(let mockStates):
                self.processState(
                    .invalid,
                    mockStates,
                    isConversionError: true,
                    ignoreReloadStatus: true
                )
            }

            return CurrentExtensionState(
                type: blockerType,
                status: state.status,
                state: state.state
            )
        }
    }

    enum TestsStates {
        case extEnabled_ReloadSucceed_UpdateSuccess
        case extEnabled_ReloadSucceed_UpdateFailed

        case extNotEnabled_ReloadSucceed_UpdateSuccess
        case extNotEnabled_ReloadSucceed_UpdateFailed

        case extEnabled_ReloadFailed_UpdateSuccess
        case extEnabled_ReloadFailed_UpdateFailed

        case extNotEnabled_ReloadFailed_UpdateSuccess
        case extNotEnabled_ReloadFailed_UpdateFailed

        var testState: TestState {
            switch self {
            case .extEnabled_ReloadSucceed_UpdateSuccess:
                TestState(
                    managerMock: .extEnabled,
                    isReloadSucceed: true,
                    storageMock: .updateSuccess
                )
            case .extEnabled_ReloadSucceed_UpdateFailed:
                TestState(
                    managerMock: .extEnabled,
                    isReloadSucceed: true,
                    storageMock: .updateFailed
                )
            case .extNotEnabled_ReloadSucceed_UpdateSuccess:
                TestState(
                    managerMock: .extNotEnabled,
                    isReloadSucceed: true,
                    storageMock: .updateSuccess
                )
            case .extNotEnabled_ReloadSucceed_UpdateFailed:
                TestState(
                    managerMock: .extNotEnabled,
                    isReloadSucceed: true,
                    storageMock: .updateFailed
                )
            case .extEnabled_ReloadFailed_UpdateSuccess:
                TestState(
                    managerMock: .extEnabled,
                    isReloadSucceed: false,
                    storageMock: .updateSuccess
                )
            case .extEnabled_ReloadFailed_UpdateFailed:
                TestState(
                    managerMock: .extEnabled,
                    isReloadSucceed: false,
                    storageMock: .updateFailed
                )
            case .extNotEnabled_ReloadFailed_UpdateSuccess:
                TestState(
                    managerMock: .extNotEnabled,
                    isReloadSucceed: false,
                    storageMock: .updateSuccess
                )
            case .extNotEnabled_ReloadFailed_UpdateFailed:
                TestState(
                    managerMock: .extNotEnabled,
                    isReloadSucceed: false,
                    storageMock: .updateFailed
                )
            }
        }

        private func setUpTestClasses(
            managerMock: ManagerMockType,
            stateMock: StorageMockType
        ) -> TestClasses {
            let eventBus = EventBusMock()
            let stateService = SafariExtensionStateServiceImpl(
                eventBus: eventBus,
                safariExtensionStatusManager: managerMock.createObject(),
                safariExtensionStateStorage: stateMock.createObject()
            )
            return (stateService, eventBus)
        }

        func createTestClasses() -> TestClasses {
            self.setUpTestClasses(managerMock: self.testState.managerMock, stateMock: self.testState.storageMock)
        }
    }
}

// swiftlint:enable identifier_name

private extension ConversionInfo {
    static var good: Self {
        ConversionInfo(
            sourceRulesCount: 100,
            sourceSafariCompatibleRulesCount: 100,
            safariRulesCount: 100,
            advancedRulesCount: 0,
            discardedSafariRules: 0,
            advancedRulesText: nil,
            errorsCount: 0
        )
    }

    static var overLimit: Self {
        ConversionInfo(
            sourceRulesCount: 100,
            sourceSafariCompatibleRulesCount: 80,
            safariRulesCount: 80,
            advancedRulesCount: 0,
            discardedSafariRules: 20,
            advancedRulesText: nil,
            errorsCount: 0
        )
    }
}
