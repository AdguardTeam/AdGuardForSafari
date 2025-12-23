#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e
source .venv/bin/activate

PROJECT_KEY="$1"
REPOSITORY_NAME="$2"
COMMIT_ID="$3"
TOKEN="$4"
BUILD_PATH_ARG="$5"
BITBUCKET_KIT_ARG="$6"

if [ -z "$PROJECT_KEY" ]; then
      echo "PROJECT_KEY is not provided"
      exit 1
fi

if [ -z "$REPOSITORY_NAME" ]; then
      echo "REPOSITORY_NAME is not provided"
      exit 1
fi

if [ -z "$COMMIT_ID" ]; then
      echo "COMMIT_ID is not provided"
      exit 1
fi

if [ -z "$TOKEN" ]; then
      echo "TOKEN is not provided"
      exit 1
fi

if [ -z "$BUILD_PATH_ARG" ]; then
      echo "BUILD_PATH is not provided"
      exit 1
fi

if [ -z "$BITBUCKET_KIT_ARG" ]; then
      echo "PATH_TO_BITBUCKET_KIT is not provided"
      exit 1
fi

mkdir -p "$BUILD_PATH_ARG"
BUILD_PATH=$(realpath "$BUILD_PATH_ARG")
PATH_TO_BITBUCKET_KIT=$(realpath "$BITBUCKET_KIT_ARG")

# Define project paths
SWIFT_SOURCE="$(realpath "AdguardMini")"
PATH_TO_ANALYSE="$SWIFT_SOURCE"
PATH_TO_CONFIG_FILE="$SWIFT_SOURCE/.swiftlint.yml"
PACKAGE_RESOLVED="$SWIFT_SOURCE/AdguardMini.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved"

# Function to extract SwiftLint version from Package.resolved
get_swiftlint_version() {
    if [ ! -f "$PACKAGE_RESOLVED" ]; then
        echo "ERROR: Package.resolved not found at $PACKAGE_RESOLVED" >&2
        return 1
    fi

    local version=$(jq -r '.pins[] | select(.identity == "swiftlintplugins") | .state.version' "$PACKAGE_RESOLVED")

    if [ -z "$version" ] || [ "$version" = "null" ]; then
        echo "ERROR: Could not extract SwiftLint version from Package.resolved" >&2
        return 1
    fi

    echo "$version"
}

# Extract SwiftLint version from Package.resolved automatically
SWIFTLINT_VERSION=$(get_swiftlint_version)
if [ $? -ne 0 ]; then
    echo "Failed to extract SwiftLint version, using fallback: 0.62.1"
    SWIFTLINT_VERSION="0.62.1"
fi

SWIFTLINT_ZIP_PATH="$BUILD_PATH/portable_swiftlint.zip"
PATH_TO_SWIFTLINT="$BUILD_PATH/swiftlint"
OUTPUT_REPORT="$BUILD_PATH/swiftlint_result.json"
PROCESSED_BASE_REPORT="$BUILD_PATH/insight_report.json"
PROCESSED_ANNOTATIONS_REPORT="$BUILD_PATH/annotations.json"

INSIGHT_KEY="com.agduard.mac.adguardMini.swiftlint"

STEP=0
step_msg() { ((++STEP)); echo "Step $STEP:" "$@"; }

step_msg "Download swiftlint version: $SWIFTLINT_VERSION"
curl -L --output $SWIFTLINT_ZIP_PATH "https://github.com/realm/SwiftLint/releases/download/$SWIFTLINT_VERSION/portable_swiftlint.zip"
unzip -o $SWIFTLINT_ZIP_PATH -d $BUILD_PATH

step_msg "Create swiftlint report"

$PATH_TO_SWIFTLINT lint \
    --config $PATH_TO_CONFIG_FILE \
    --working-directory $PATH_TO_ANALYSE \
    --reporter json \
    --output $OUTPUT_REPORT \
    --quiet \
    || true

step_msg "Create bitbucket insights reports"

python3 bamboo-specs/scripts/create_linter_report.py \
    --report-path $OUTPUT_REPORT \
    --root-path . \
    --report-output-path $PROCESSED_BASE_REPORT \
    --annotations-output-path $PROCESSED_ANNOTATIONS_REPORT

step_msg "Send base report"

python3 $PATH_TO_BITBUCKET_KIT \
    createBaseReport \
    -t $TOKEN \
    -p $PROJECT_KEY \
    -r $REPOSITORY_NAME \
    --commit-id $COMMIT_ID \
    --insight-key $INSIGHT_KEY \
    --report $PROCESSED_BASE_REPORT

step_msg "Send annotations"

python3 $PATH_TO_BITBUCKET_KIT \
    createAnnotations \
    -t $TOKEN \
    -p $PROJECT_KEY \
    -r $REPOSITORY_NAME \
    --commit-id $COMMIT_ID \
    --insight-key $INSIGHT_KEY \
    --annotations $PROCESSED_ANNOTATIONS_REPORT
