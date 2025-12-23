#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

CHANNEL=${1}
LAST_TAG=$(git tag -l "*-${CHANNEL}" --sort='-creatordate' | head -n 1)

if [[ -z "${LAST_TAG}" ]]; then
    echo "No tags containing '${CHANNEL}' were found"
    exit 0
fi

LAST_TAG_DIFF=$(git --no-pager diff "${LAST_TAG}")

if [[ -z "${LAST_TAG_DIFF}" ]]; then
    echo "The repository has not changed since the last deploy"
    exit 1
fi

echo "Latest tag for '${CHANNEL}' channel: ${LAST_TAG}"
echo "Changes since the last tag detected."
