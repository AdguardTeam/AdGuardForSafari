#!/bin/bash

set -e
set -x

config_file=./AdGuard/Config.xcconfig

current_version=$(grep 'AG_VERSION = ' "$config_file")
current_build_number=$(grep 'AG_BUILD = ' "$config_file")

echo "Current version: $current_version"
echo "Current build number: $current_build_number"

IFS='.' read -a version_parts <<< "$current_version"
major=${version_parts[0]}
minor=${version_parts[1]}
patch=${version_parts[2]}

patch=$((patch + 1))
new_version="$major.$minor.$patch"
echo "New version: $new_version"

IFS=' = ' read -a build_number_parts <<< "$current_build_number"
build_number=$((build_number_parts[1] + 1))
new_build_number="${build_number_parts[0]} = $build_number"
echo "New build number: $new_build_number"

sed -i "" "s/$current_version/$new_version/" "$config_file"
sed -i "" "s/$current_build_number/$new_build_number/" "$config_file"



