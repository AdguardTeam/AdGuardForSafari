#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

config_file=./AdguardMini/CommonConfig.xcconfig

check_string="$1 = "
current_version_number=$(grep "$check_string" "$config_file")

echo "Current $1 number: $current_version_number"

IFS=' = ' read -a version_number_parts <<< "$current_version_number"
version_number=$((version_number_parts[1] + 1))
if ! [ -z "$2" ]
  then
    echo "Override $1 number"
    version_number=$2
fi
new_version_number="${version_number_parts[0]} = $version_number"
echo "New $1 number: $new_version_number"

sed "s/$current_version_number/$new_version_number/" "$config_file" > tmp; mv tmp "$config_file"
