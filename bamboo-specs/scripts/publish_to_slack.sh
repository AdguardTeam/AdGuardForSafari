#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

SLACK_KIT_PATH="${1}"

ARTIFACTS_PATH="${2}"
AG_MINI_NAME="AdGuardMini"
APP_PATH="${ARTIFACTS_PATH}/${AG_MINI_NAME}.app.zip"
CHANGELOG_PATH="${ARTIFACTS_PATH}/changelog.md"

SLACK_CHANNEL="adguard-mini-deploy"

CHANNEL=${bamboo_inject_channel}
VERSION_NAME=${bamboo_inject_version_name}

SEARCH_PINNED_ITEM="[${CHANNEL}] AdGuard Mini for Mac"
COMMENT_FOR_PACKAGE="${SEARCH_PINNED_ITEM} ${VERSION_NAME}"

if [ ! -f "$APP_PATH" ]; then
    echo "Error: App archive file '$APP_PATH' does not exist."
    exit 1
fi

if [ ! -f "$CHANGELOG_PATH" ]; then
    echo "Error: Changelog file '$CHANGELOG_PATH' does not exist."
    exit 1
fi

# Publish and pin build

"${SLACK_KIT_PATH}" \
    -f ${APP_PATH} \
    -m "${COMMENT_FOR_PACKAGE}" \
    -c ${SLACK_CHANNEL} \
    -fn "${AG_MINI_NAME}-${VERSION_NAME}.zip" \
    -pin \
    -unpin ${SEARCH_PINNED_ITEM}

# Publish changelog

"${SLACK_KIT_PATH}" \
    -f ${CHANGELOG_PATH} \
    -m "AdGuard Mini for Mac changelog from ${bamboo_inject_tag_from}" \
    -c ${SLACK_CHANNEL}
