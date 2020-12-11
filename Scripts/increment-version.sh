#!/bin/bash

set -e
set -x

config_file=./AdGuard/Config.xcconfig

current_version=$(grep 'AG_VERSION = ' "$config_file")

echo "Current version: $current_version"

IFS='.' read -a version_parts <<< "$current_version"
major=${version_parts[0]}
minor=${version_parts[1]}
patch=${version_parts[2]}

patch=$((patch + 1))
new_version="$major.$minor.$patch"
echo "New version: $new_version"

sed -i "" "s/$current_version/$new_version/" "$config_file"

yarn version --patch --no-git-tag-version --cwd "./ElectronMainApp/"



