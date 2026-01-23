// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

export const ADGUARD_MINI_TITLE = 'AdGuard Mini';

/**
 * Splitter for editor rules
 * We have to format data in this way because of sciter messages do not support json, only strings
 * We use this splitter to split enabled/disabled state and rule text
 * Data format:
 * 1!~!rule
 * 0!~!rule
 * Data flow: in get_initial on sciter side we transform data with this splitter
 * and split it on client side to get enabled/disabled state and rule text
 */
export const SPLITTER = '!~!';

export enum UserRulesPages {
    RuleEditorScreen = 'rule_editor_screen',
}

export enum UserRulesEvents {
    RuleCreatedClick = 'rule_created_click',
}

/**
 * Events for rules editor, to pass from webview to sciter and vice versa
 */
export enum RulesEditorEvents {
    fallback_mode = 'fallback_mode',
    get_initial_data = 'get_initial_data',
    initial_chunk_start = 'initial_chunk_start',
    initial_chunk = 'initial_chunk',
    initial_chunk_end = 'initial_chunk_end',
    initial = 'initial',
    init_theme = 'init_theme',
    theme = 'theme',
    open_dns_filtering_kb = 'open_dns_filtering_kb',
    open_report_bug = 'open_report_bug',
    save_changes = 'save_changes',
    close_request = 'close_request',
    close = 'close',
    user_rules_updated = 'user_rules_updated',
    update = 'update',
    rules_saved = 'rules_saved',
    language = 'language',
    telemetry_page_view = 'telemetry_page_view',
    telemetry_event_rules_created_click = 'telemetry_event_rules_created_click',
}
