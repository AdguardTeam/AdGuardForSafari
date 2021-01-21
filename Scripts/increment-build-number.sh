#!/bin/bash

set -e
set -x

config_file=./AdGuard/Config.xcconfig

current_build_number=$(grep 'AG_BUILD = ' "$config_file")

echo "Current build number: $current_build_number"

IFS=' = ' read -a build_number_parts <<< "$current_build_number"
build_number=$((build_number_parts[1] + 1))
new_build_number="${build_number_parts[0]} = $build_number"
echo "New build number: $new_build_number"

sed "s/$current_build_number/$new_build_number/" "$config_file" > tmp; mv tmp "$config_file"



