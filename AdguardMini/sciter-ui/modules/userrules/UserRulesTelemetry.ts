// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import Telemetry from "Modules/common/stores/Telemetry";

export enum UserRulesPages {
    RuleEditorScreen = 'rule_editor_screen',
}

export enum UserRulesEvents {
    RuleCreatedClick = 'rule_created_click'
}

/**
 * Telemetry relay for user rules editor
 */
export class UserRulesTelemetry extends Telemetry<UserRulesPages, UserRulesEvents, never> {}
