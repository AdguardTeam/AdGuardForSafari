#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

printf "%b\n" "${bamboo_sshSecretKey}" | ssh-add -
