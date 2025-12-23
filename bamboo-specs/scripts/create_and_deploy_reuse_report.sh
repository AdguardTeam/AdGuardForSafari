#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

PROJECT_KEY="$1"
REPOSITORY_NAME="$2"
COMMIT_ID="$3"
TOKEN="$4"

BUILD_PATH="$5"
PATH_TO_BITBUCKET_KIT="$6"

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

if [ -z "$BUILD_PATH" ]; then
      echo "BUILD_PATH is not provided"
      exit 1
fi

if [ -z "$PATH_TO_BITBUCKET_KIT" ]; then
      echo "PATH_TO_BITBUCKET_KIT is not provided"
      exit 1
fi

OUTPUT_REPORT="$BUILD_PATH/reuse_result.json"
PROCESSED_BASE_REPORT="$BUILD_PATH/insight_report.json"
PROCESSED_ANNOTATIONS_REPORT="$BUILD_PATH/annotations.json"

INSIGHT_KEY="com.adguard.mac.adguardMini.reuse"

STEP=0
step_msg() { ((++STEP)); echo "Step $STEP:" "$@"; }

step_msg "Create build dir"
mkdir -p $BUILD_PATH

step_msg "Setup Python virtual environment"
/usr/bin/python3 -m venv .venv
source .venv/bin/activate

step_msg "Install reuse tool"
python -m pip install reuse requests

step_msg "Run reuse lint"
reuse lint --json > $OUTPUT_REPORT || true

step_msg "Create bitbucket insights reports"

python bamboo-specs/scripts/create_reuse_report.py \
    --report-path $OUTPUT_REPORT \
    --report-output-path $PROCESSED_BASE_REPORT \
    --annotations-output-path $PROCESSED_ANNOTATIONS_REPORT

step_msg "Send base report"

python $PATH_TO_BITBUCKET_KIT \
    createBaseReport \
    -t $TOKEN \
    -p $PROJECT_KEY \
    -r $REPOSITORY_NAME \
    --commit-id $COMMIT_ID \
    --insight-key $INSIGHT_KEY \
    --report $PROCESSED_BASE_REPORT

step_msg "Send annotations"
if [ "$(jq -r '.annotations | length' "$PROCESSED_ANNOTATIONS_REPORT")" -eq 0 ]; then
    echo "No annotations to send. Skipping createAnnotations."
else
    python $PATH_TO_BITBUCKET_KIT \
        createAnnotations \
        -t $TOKEN \
        -p $PROJECT_KEY \
        -r $REPOSITORY_NAME \
        --commit-id $COMMIT_ID \
        --insight-key $INSIGHT_KEY \
        --annotations $PROCESSED_ANNOTATIONS_REPORT
fi
