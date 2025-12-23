#!/bin/bash

# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

set -e

# Step 1. Remove app settings

APP_ID=com.adguard.safari.AdGuard

echo "[INFO] Removing $APP_ID data..."

defaults delete-all $APP_ID || true
rm -rf "$HOME/Library/Group Containers/TC3Q7MAJXF.com.adguard.mac/Library/Application Support/$APP_ID"

# Step 2. Clear keychain

echo "[INFO] Removing $APP_ID keychain data..."
for acc in $(security find-generic-password -s com.adguard.safari.AdGuard 2>/dev/null | grep '"acct"' | sed -E 's/.*"acct"<blob>="(.*)"/\1/'); do
  echo "Deleting account: $acc"
  security delete-generic-password -s com.adguard.safari.AdGuard -a "$acc" 2>/dev/null
done

# Step 3. Remove shared settings

GROUP_ID="TC3Q7MAJXF.com.adguard.safari.AdGuard"
GROUP_DIR="$HOME/Library/Group Containers/$GROUP_ID"
PREFS_PLIST="$GROUP_DIR/Library/Preferences/$GROUP_ID.plist"

echo "[INFO] Killing cfprefsd cache daemon..."
killall cfprefsd 2>/dev/null || true

echo "[INFO] Searching for apps using group: $GROUP_ID"

PIDS=$(lsof +D "$GROUP_DIR" 2>/dev/null | awk '{print $2}' | grep -E '^[0-9]+$' | sort -u)

if [ -z "$PIDS" ]; then
    echo "[INFO] No active processes found using the group."
else
    echo "[INFO] Found processes using the group:"
    for pid in $PIDS; do
        PROC_NAME=$(ps -p "$pid" -o comm=)
        echo "[INFO] Killing process: $PROC_NAME (PID $pid)"
        kill "$pid" 2>/dev/null || echo "[WARN] Failed to kill PID $pid"
    done
    sleep 1
fi

echo "[INFO] Deleting suite preferences file:"
echo "       $PREFS_PLIST"

if [ -f "$PREFS_PLIST" ]; then
    rm "$PREFS_PLIST"
    echo "[SUCCESS] File deleted."
else
    echo "[WARN] File not found — maybe already clean."
fi

echo "[INFO] Flushing cache again..."
killall cfprefsd 2>/dev/null || true

echo "[INFO] Verifying..."
if [ -f "$PREFS_PLIST" ]; then
    echo "[ERROR] File still exists after deletion."
    exit 1
else
    echo "[SUCCESS] Group UserDefaults fully cleared."
fi

# Step 4. Reload Safari extensions

pluginkit -mAvvv -p com.apple.Safari.extension
