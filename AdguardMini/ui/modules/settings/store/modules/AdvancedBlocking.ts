// SPDX-FileCopyrightText: AdGuard Software Limited
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { makeAutoObservable, flow } from 'mobx';

import {
    GetURLFilterStateRequest,
    GetURLFilterSeenRequest,
    SetURLFilterEnabledRequest,
    UpdateURLFilterSeenRequest,
    RequestUpdateURLFilterProtectionLevelRequest,
    UpdateRealTimeFiltersUpdateRequest,
    ResetURLFilterCacheRequest,
    RemoveURLFilterRequest,
    RetryURLFilterRequest,
    GetRealTimeFiltersUpdateRequest,
    GetAdguardExtraRequest,
    GetAdvancedRulesRequest,
    UpdateAdvancedRulesRequest,
    UpdateAdguardExtraRequest,
} from 'Apis/requests/AdvancedBlockingService';
import {
    URLFilterState,
    URLFilterStatus,
} from 'Apis/types';
import {
    NotificationContext,
    NotificationsQueueIconType,
    NotificationsQueueType,
    NotificationsQueueVariant,
} from 'Common/stores/NotificationsQueue';
import { getNotificationSomethingWentWrongText } from 'SettingsLib/utils/translate';

import type { BoolValue, URLFilterInfo, URLFilterProtectionLevel } from 'Apis/types';
import type { NotificationsQueue } from 'Common/stores/NotificationsQueue';

/**
 * How long the stats of a pushed URL filter state are held before they are
 * shown without waiting for the next push.
 *
 * The platform pushes the state more than once for one change: the first
 * push carries the previous stats (the URL filter extension persists the new
 * metadata only after the bloom filter download) and the next one carries the
 * fresh stats.
 */
export const URL_FILTER_INFO_FALLBACK_TIMEOUT_MS = 10_000;

/**
 * Checks whether a pushed stats snapshot carries any filtering rules data.
 *
 * The platform omits both fields when the prefilter metadata is absent, for
 * example before the first download.
 *
 * @param info Stats snapshot from the platform.
 */
function hasURLFilterStats(info: URLFilterInfo): boolean {
    return info.has_rules_count || info.has_last_update;
}

/**
 * Kind of a System-wide Protection failure, used as the deduplication key of
 * the notification shown for it.
 */
enum URLFilterErrorKind {
    /** System-wide Protection could not be started or reconfigured. */
    enable = 'enable',
    /** A maintenance call (cache reset, filter removal) failed. */
    maintenance = 'maintenance',
}

/**
 *  AdvancedBlocking store
 */
export class AdvancedBlocking {
    /**
     * Kind of the System-wide Protection error the shown snack covers.
     *
     * The platform pushes the state several times for one failed change, so
     * reports of one kind are collapsed into the snack already on screen.
     */
    private reportedURLFilterErrorKind: URLFilterErrorKind | null = null;

    /**
     * Id of the shown System-wide Protection error notification, so a
     * different error replaces it instead of stacking another one.
     */
    private urlFilterErrorNotificationId: string | null = null;

    /**
     * Whether the "unavailable" snack was already shown for an automatic
     * failure during the current System-wide Protection page visit.
     *
     * The platform retries a failed bring-up while the page is open and
     * reports the same failure again and again; the design counts automatic
     * attempts per visit. An explicit attempt reports its own failure, and a
     * recovery re-arms the automatic report.
     */
    private unavailableSnackShownThisVisit = false;

    /**
     * Notifications queue used to surface error toasts.
     */
    private readonly notification: NotificationsQueue;

    /**
     * Opens the System-wide Protection page, where the troubleshooting steps are.
     */
    private readonly openSystemWideProtection: () => void;

    /**
     * Whether the stats of a pushed state are being held: the next push — or
     * the timeout — shows them.
     */
    private isStatsHeld = false;

    /**
     * Stats of the held pushed state.
     */
    private pendingStats: URLFilterInfo | null = null;

    /**
     * Timer that shows the held stats when no further push arrives.
     */
    private statsHoldTimer: ReturnType<typeof setTimeout> | null = null;

    /**
     * Advanced rules state
     */
    public advancedRules = false;

    /**
     * AdGuard Extra state
     */
    public adguardExtra = false;

    /**
     * Real-time filters update state
     */
    public realTimeFiltersUpdate = false;

    /**
     * URL filter state for system-wide protection settings.
     */
    public urlFilterState = new URLFilterState();

    /**
     * URL filter info for system-wide protection settings.
     * null for loading
     */
    public urlFilterInfo: null | URLFilterInfo = null;

    /**
     * URL filter seen.
     */
    public urlFilterNew = false;

    /**
     * Whether the System-wide Protection page must scroll its Troubleshooting
     * block into view: the snack action points the user to the steps.
     */
    public scrollToTroubleshootingRequested = false;

    /**
     * Whether System-wide Protection is unavailable because a DNS filter
     * blocks the iCloud hosts it needs: the Safari Protection page shows its
     * dedicated card for this failure instead of a snack.
     */
    public get isSystemWideProtectionUnavailable(): boolean {
        return this.urlFilterState.status === URLFilterStatus.dns_error;
    }

    /**
     * Whether the filter is being enabled: the switch shows the in-progress
     * "on" state while the bring-up runs.
     */
    public get isSystemWideProtectionEnabling(): boolean {
        return this.urlFilterState.userIntentEnabled
            && this.urlFilterState.status === URLFilterStatus.loading;
    }

    /**
     * Whether the switch must show the ON INACTIVE state: the user's choice
     * is on, but the bring-up failed and the filter is not running.
     */
    public get isSystemWideProtectionInactive(): boolean {
        return this.urlFilterState.userIntentEnabled
            && this.urlFilterState.status !== URLFilterStatus.running
            && !this.isSystemWideProtectionEnabling;
    }

    /**
     * Ctor
     *
     * @param notification Notifications queue used to surface error toasts.
     * @param openSystemWideProtection Opens the System-wide Protection page.
     */
    public constructor(notification: NotificationsQueue, openSystemWideProtection: () => void) {
        this.notification = notification;
        this.openSystemWideProtection = openSystemWideProtection;
        makeAutoObservable(this, {
            getAdvancedRules: flow,
            getAdguardExtra: flow,
            getRealTimeFiltersUpdate: flow,
        }, { autoBind: true });
    }

    /**
     * Whether the snack of the given kind is currently on screen.
     *
     * The snack may have been dropped by another notification without clearing
     * the id, so the queue — not the id — tells whether it shows.
     *
     * @param kind Kind of the failure the snack reports.
     */
    private isURLFilterErrorSnackShown(kind: URLFilterErrorKind): boolean {
        return this.reportedURLFilterErrorKind === kind
            && this.urlFilterErrorNotificationId !== null
            && this.notification.get(this.urlFilterErrorNotificationId) !== undefined;
    }

    /**
     * Reports an automatic bring-up failure that reached the UI as a state
     * change: a push or a pull of a failed state.
     *
     * The snack is shown wherever the user is, but automatic reports are
     * collapsed per page visit: the platform retries the bring-up while the
     * System-wide Protection page is open and reports one failure several
     * times, and the design counts automatic attempts per visit.
     */
    private reportAutomaticURLFilterFailure() {
        if (this.unavailableSnackShownThisVisit) {
            return;
        }
        this.showSystemWideProtectionUnavailableSnack();
    }

    /**
     * Shows the snack for a System-wide Protection bring-up failure.
     *
     * The failure is reported wherever the user is — the switch also lives on
     * the Advanced blocking page, so the failure can arrive while the settings
     * window is on any page. Reports of one kind share a single snack while it
     * is on screen; an automatic report is also remembered for the page visit,
     * so it is not shown again after the snack closed.
     */
    private showSystemWideProtectionUnavailableSnack() {
        if (this.isURLFilterErrorSnackShown(URLFilterErrorKind.enable)) {
            return;
        }
        this.unavailableSnackShownThisVisit = true;
        this.closeURLFilterErrorNotification();
        this.reportedURLFilterErrorKind = URLFilterErrorKind.enable;
        this.urlFilterErrorNotificationId = this.notification.notify({
            message: translate('advanced.blocking.system.wide.unavailable'),
            notificationContext: NotificationContext.ctaButton,
            type: NotificationsQueueType.warning,
            iconType: NotificationsQueueIconType.error,
            variant: NotificationsQueueVariant.textOnly,
            btnLabel: translate('advanced.blocking.system.wide.troubleshooting'),
            onClick: () => {
                this.closeURLFilterErrorNotification();
                this.requestTroubleshootingScroll();
                this.openSystemWideProtection();
            },
            closeable: true,
            onClose: () => {
                this.urlFilterErrorNotificationId = null;
            },
        });
    }

    /**
     * Closes the shown System-wide Protection error notification, if any.
     */
    private closeURLFilterErrorNotification() {
        if (this.urlFilterErrorNotificationId === null) {
            return;
        }
        this.notification.closeNotify(this.urlFilterErrorNotificationId);
        this.urlFilterErrorNotificationId = null;
    }

    /**
     * Shows the notification for a maintenance failure (cache reset, filter
     * removal).
     *
     * One failed change reaches the UI more than once — the request response
     * and the pushed state both report it — so failures of one kind share a
     * single notification while it is on screen. Once the snack is gone —
     * auto-closed, dismissed, or dropped by another notification — the next
     * failure is reported again.
     *
     * @param kind Kind of the failure to report.
     */
    private notifyURLFilterError(kind: URLFilterErrorKind) {
        if (this.isURLFilterErrorSnackShown(kind)) {
            return;
        }
        // A different error supersedes the previous one: one error, one snack.
        this.closeURLFilterErrorNotification();
        this.reportedURLFilterErrorKind = kind;
        this.urlFilterErrorNotificationId = this.notification.notify({
            message: getNotificationSomethingWentWrongText(),
            notificationContext: NotificationContext.info,
            type: NotificationsQueueType.warning,
            iconType: NotificationsQueueIconType.error,
            closeable: true,
            onClose: () => {
                this.urlFilterErrorNotificationId = null;
            },
        });
    }

    /**
     * Clears the failure-reporting state once the filter recovered or a change
     * landed, so a failure after it is reported again.
     */
    private resetURLFilterError() {
        this.reportedURLFilterErrorKind = null;
        this.unavailableSnackShownThisVisit = false;
    }

    /**
     * Holds the stats of a pushed state: they are shown only when the next
     * push arrives or the timeout passes, never on their own. The first push
     * carries the previous stats (the URL filter extension persists the new
     * metadata only after the bloom filter download), so showing it would end
     * the loader with a stale count.
     *
     * @param info Pushed stats.
     */
    private holdStats(info: URLFilterInfo) {
        this.isStatsHeld = true;
        this.pendingStats = hasURLFilterStats(info) ? info : null;
        this.cancelStatsHoldTimeout();
        this.statsHoldTimer = setTimeout(() => {
            this.statsHoldTimer = null;
            if (!this.isStatsHeld) {
                return;
            }
            // Nothing else arrived: show the held stats.
            this.showStats(this.pendingStats ?? this.urlFilterState.info);
        }, URL_FILTER_INFO_FALLBACK_TIMEOUT_MS);
    }

    /**
     * Shows the given stats and drops any held ones.
     *
     * @param info Stats to display.
     */
    private showStats(info: URLFilterInfo) {
        this.isStatsHeld = false;
        this.pendingStats = null;
        this.cancelStatsHoldTimeout();
        this.setURLFilterInfo(info);
    }

    /**
     * Cancels the pending hold timeout, if any.
     */
    private cancelStatsHoldTimeout() {
        if (this.statsHoldTimer === null) {
            return;
        }
        clearTimeout(this.statsHoldTimer);
        this.statsHoldTimer = null;
    }

    /**
     * Starts a System-wide Protection page visit: automatic failure reports
     * are collapsed to one per visit. Losing and returning focus does not
     * start a new visit.
     */
    public beginSystemWideProtectionPageVisit() {
        this.unavailableSnackShownThisVisit = false;
    }

    /**
     * Ends a System-wide Protection page visit: automatic failure reports are
     * no longer collapsed, so a failure reported on another page is shown
     * again. Losing and returning focus does not end a visit.
     */
    public endSystemWideProtectionPageVisit() {
        this.unavailableSnackShownThisVisit = false;
    }

    /**
     * Asks the System-wide Protection page to scroll to the troubleshooting
     * steps: the failure snack points the user there.
     */
    public requestTroubleshootingScroll() {
        this.scrollToTroubleshootingRequested = true;
    }

    /**
     * Clears the pending troubleshooting scroll request once the page scrolls
     * to the steps.
     */
    public consumeTroubleshootingScroll() {
        this.scrollToTroubleshootingRequested = false;
    }

    /**
     * URL filter state setter
     */
    public setURLFilterState(data: URLFilterState) {
        this.urlFilterState = data;
    }

    /**
     * Setter for URL filter info.
     * @param data URL filter info to set.
     */
    public setURLFilterInfo(data: typeof this.urlFilterInfo) {
        this.urlFilterInfo = data;
    }

    /**
     * Applies a URL filter state pushed by the platform.
     *
     * The platform pushes the state more than once for one change: the first
     * push carries the previous stats (the URL filter extension persists the
     * new metadata only after the bloom filter download) and the next one
     * carries the fresh stats. The stats of the first push are therefore only
     * held, and the display is updated by the next push — or by the timeout,
     * when it never comes. A single push never ends the loader with a stale
     * count, and the number of pushes does not matter.
     *
     * @param data URL filter state from the platform.
     */
    public applyPushedURLFilterState(data: URLFilterState) {
        this.setURLFilterState(data);
        if (data.status === URLFilterStatus.error || data.status === URLFilterStatus.dns_error) {
            this.reportAutomaticURLFilterFailure();
        } else if (data.status === URLFilterStatus.running) {
            // The filter works again: a later failure is a new error.
            this.resetURLFilterError();
        }

        if (!this.isStatsHeld) {
            // First pushed state: hold its stats until the next push.
            this.holdStats(data.info);
            return;
        }

        // Next pushed state: show its stats — the held ones when it carries none.
        const resolved = hasURLFilterStats(data.info) ? data.info : this.pendingStats;
        this.showStats(resolved ?? data.info);
    }

    /**
     * URL filter state setter
     */
    public setURLFilterSeen(data: boolean) {
        this.urlFilterNew = data;
    }

    /**
     * Get all advanced blocking settings from swift
     */
    public getAdvancedBlocking() {
        this.getAdguardExtra();
        this.getAdvancedRules();
        this.getRealTimeFiltersUpdate();
    }

    /**
     * Get advancedRules state
     */
    public *getAdvancedRules() {
        const resp: BoolValue = yield window.API.Execute(new GetAdvancedRulesRequest());
        this.advancedRules = resp.value;
    }

    /**
     * Get adguardExtra state
     */
    public *getAdguardExtra() {
        const resp: BoolValue = yield window.API.Execute(new GetAdguardExtraRequest());
        this.adguardExtra = resp.value;
    }

    /**
     * Get realTimeFiltersUpdate state
     */
    public *getRealTimeFiltersUpdate() {
        const resp: BoolValue = yield window.API.Execute(new GetRealTimeFiltersUpdateRequest());
        this.realTimeFiltersUpdate = resp.value;
    }

    /**
     * Update AdvancedRules setting
     */
    public *updateAdvancedRules(value: boolean) {
        this.advancedRules = value;
        window.API.Execute(new UpdateAdvancedRulesRequest({ value }));
    }

    /**
     * Update AdguardExtra setting
     */
    public *updateAdguardExtra(value: boolean) {
        this.adguardExtra = value;
        window.API.Execute(new UpdateAdguardExtraRequest({ value }));
    }

    /**
     * Update realTimeFiltersUpdate setting
     */
    public *updateRealTimeFiltersUpdate(value: boolean) {
        this.realTimeFiltersUpdate = value;
        window.API.Execute(new UpdateRealTimeFiltersUpdateRequest({ value }));
    }

    /**
     * Get URL filter state from swift
     *
     * @param reportFailure Whether an error state shows the unavailable snack;
     * a maintenance call reports its own failure instead.
     */
    public async getURLFilterState(reportFailure = true) {
        const resp = await window.API.Execute(new GetURLFilterStateRequest());
        this.setURLFilterState(resp);
        this.showStats(resp.info);
        if (resp.status === URLFilterStatus.error || resp.status === URLFilterStatus.dns_error) {
            if (reportFailure) {
                this.reportAutomaticURLFilterFailure();
            }
        } else if (resp.status === URLFilterStatus.running) {
            // The filter works again: a later failure is a new error.
            this.resetURLFilterError();
        }
    }

    /**
     * Get URL filter state from swift
     */
    public async getURLFilterSeen() {
        const resp = await window.API.Execute(new GetURLFilterSeenRequest());
        this.setURLFilterSeen(resp.value);
    }

    /**
     * Update SystemWideProtection switch setting
     */
    public async updateSystemWideProtection(value: boolean) {
        const newValue = this.urlFilterState.clone();
        newValue.userIntentEnabled = value;
        this.setURLFilterState(newValue);
        const resp = await window.API.Execute(new SetURLFilterEnabledRequest({ value }));
        if (resp.hasError) {
            // The platform persists the intent before attempting the start,
            // so the pull — not the response — tells the effective state.
            await this.getURLFilterState(false);
            // A declined system install prompt clears the intent: no failure to report.
            const isDeclined = value && !this.urlFilterState.userIntentEnabled;
            if (!isDeclined) {
                // The user pressed the switch: the failure is reported wherever it was pressed.
                this.showSystemWideProtectionUnavailableSnack();
            }
        } else {
            // The toggle landed: the error state of the previous attempt is over.
            this.resetURLFilterError();
        }
    }

    /**
     * Asks the platform to retry a failed bring-up: called when the
     * System-wide Protection page opens and when the settings window regains
     * focus while it is open.
     *
     * The platform re-checks the user's intent, the main switch, and the
     * license, and never creates a configuration on its own.
     */
    public async retrySystemWideProtection() {
        if (!this.urlFilterState.userIntentEnabled) {
            return;
        }
        await window.API.Execute(new RetryURLFilterRequest());
    }

    /**
     * Update level of protection for SystemWideProtection setting
     */
    public async updateSystemWideProtectionLevel(protectionLevel: URLFilterProtectionLevel) {
        // Re-selecting the active level must not dispatch: it would restart the filter.
        if (protectionLevel === this.urlFilterState.protectionLevel) {
            return;
        }
        const newValue = this.urlFilterState.clone();
        const prevValue = this.urlFilterState.clone();
        // The loader covers the window until the pushed stats are resolved.
        this.setURLFilterInfo(null);
        newValue.protectionLevel = protectionLevel;
        this.setURLFilterState(newValue);
        const resp = await window.API.Execute(new RequestUpdateURLFilterProtectionLevelRequest({ protectionLevel }));
        if (resp.hasError) {
            this.notifyURLFilterError(URLFilterErrorKind.enable);
            this.setURLFilterState(prevValue);
            this.showStats(prevValue.info);
            await this.getURLFilterState();
        } else {
            // The level change landed: the error state of the previous attempt is over.
            this.resetURLFilterError();
        }
    }

    /**
     * Resets URL filter prefilter cache.
     */
    public async resetURLFilterCache() {
        const resp = await window.API.Execute(new ResetURLFilterCacheRequest());
        if (resp.hasError) {
            // The maintenance failure is the reported one; the pull only refreshes the state.
            await this.getURLFilterState(false);
            this.notifyURLFilterError(URLFilterErrorKind.maintenance);
        } else {
            return true;
        }
    }

    /**
     * Removes URL filter configuration.
     */
    public async removeURLFilter() {
        const resp = await window.API.Execute(new RemoveURLFilterRequest());
        if (resp.hasError) {
            // The maintenance failure is the reported one; the pull only refreshes the state.
            await this.getURLFilterState(false);
            this.notifyURLFilterError(URLFilterErrorKind.maintenance);
        } else {
            return true;
        }
    }

    /**
     * Marks system-wide protection card as seen.
     */
    public updateURLFilterSeen(value: boolean) {
        this.setURLFilterSeen(value);
        window.API.Execute(new UpdateURLFilterSeenRequest({ value }));
    }
}
