#!/bin/bash

mkdir -p $TARGET_TEMP_DIR/arm64
mkdir -p $TARGET_TEMP_DIR/x86_64

echo "Build electron app for arm64"
bash ../Scripts/build-electron-app-one-arch.sh arm64 "$TARGET_TEMP_DIR/arm64"

echo "Build electron app for x86_64"
bash ../Scripts/build-electron-app-one-arch.sh x86_64 "$TARGET_TEMP_DIR/x86_64"

echo "Create universal build"
cd ../ElectronMainApp
yarn make-universal-app "$TARGET_TEMP_DIR"

APP_NAME="AdGuard for Safari.app"
cp -HRfp "$TARGET_TEMP_DIR/$APP_NAME" "$BUILT_PRODUCTS_DIR"


cd ../AdGuard
