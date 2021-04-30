#!/bin/bash

set -e

echo "Building electron app with config:"
echo "CONFIGURATION: ${CONFIGURATION}"
echo "AG_STANDALONE: ${AG_STANDALONE}"
echo "AG_STANDALONE_BETA: ${AG_STANDALONE_BETA}"

PLATFORM=mas
ARCH=${1}

if [[ ${ARCH} == "x86_64" ]]; then
    ARCH=x64
fi

echo "Building for ${ARCH}"

SRC="${SRCROOT}/../ElectronMainApp"
SHAREDSRC="${SRCROOT}/../Shared"

# Cleaning safari-ext
if [[ ${ACTION} == "clean" ]]; then
  cd "${SHAREDSRC}"
  node-gyp clean || exit 1
  exit 0
fi

# Update package.json
sed -i "" "s/AG_STANDALONE_BETA/${AG_STANDALONE_BETA}/g" "${SRC}/package.json"
sed -i "" "s/AG_STANDALONE_BUILD/${AG_STANDALONE}/g" "${SRC}/package.json"
sed -i "" "s/AG_BUILD_CONFIGURATION/${CONFIGURATION}/g" "${SRC}/package.json"

# Rebuild electron app
cd "${SRC}"
yarn install --force || exit 1

# Extract Electron version
ELECTRON_VERSION=$(jq -r ".devDependencies.electron" ../ElectronMainApp/package.json)

# Remove prefix "^"
ELECTRON_VERSION=${ELECTRON_VERSION#"^"}

# Rebuild safari-ext and other node packages
yarn electron-rebuild --arch=${ARCH} -v ${ELECTRON_VERSION}

OPT="--asar.unpack=*.node"

if [[ ${AG_STANDALONE} == "true" ]]; then
  echo "Changing standalone build platform"
  PLATFORM="darwin"
fi

# run electron-packager for both architectures to get similar asar files in universal build
# to be able to get rid of redundant asar files later
ARCHS="--arch=x64 --arch=arm64"
electron-packager "${SRC}" "${PRODUCT_NAME}" --electron-version=${ELECTRON_VERSION} --platform=${PLATFORM} --app-bundle-id="${AG_BUNDLEID}" \
${ARCHS} --app-version="${AG_VERSION}"  --build-version="${AG_BUILD}" --prune=true --overwrite --out="${2}" --osx-sign=false \
${OPT} || exit 1

APP="${2}/${PRODUCT_NAME}-${PLATFORM}-${ARCH}/${PRODUCT_NAME}.app"
FRAMEWORKS="${APP}/Contents/Frameworks"

if [[ ${PLATFORM} == "mas" ]]; then
    # electron-packager produces additional login helper for release version only,
    # that we don't need, because we use our own.
    # https://github.com/AdguardTeam/AdGuardForSafari/issues/204
    rm -r "${APP}/Contents/Library/LoginItems/${PRODUCT_NAME} Login Helper.app" || exit 1
fi

# Remove redundant signatures which fail a universal build bundling,
# because all non-binary files must have identical SHAs when creating a universal build.
rm -Rfv "$FRAMEWORKS/Electron Framework.framework/Versions/A/_CodeSignature/CodeResources"
rm -Rfv "$FRAMEWORKS/Mantle.framework/Versions/A/_CodeSignature/CodeResources"
rm -Rfv "$FRAMEWORKS/ReactiveObjC.framework/Versions/A/_CodeSignature/CodeResources"
rm -Rfv "$FRAMEWORKS/Squirrel.framework/Versions/A/_CodeSignature/CodeResources"
rm -Rfv "$FRAMEWORKS/../_CodeSignature/CodeResources"

# Move products
DST_DIR="${BUILT_PRODUCTS_DIR}"
if [[ ${ACTION} == "install" ]]; then
  DST_DIR="${INSTALL_ROOT}/Applications/"
  mkdir -p "${DST_DIR}"
fi

# Update package.json
sed -i "" "s/\"standalone-build\": \"${AG_STANDALONE}\"/\"standalone-build\": \"AG_STANDALONE_BUILD\"/g" "${SRC}/package.json"
sed -i "" "s/\"standalone-beta\": \"${AG_STANDALONE_BETA}\"/\"standalone-beta\": \"AG_STANDALONE_BETA\"/g" "${SRC}/package.json"
sed -i "" "s/\"build-configuration\": \"${CONFIGURATION}\"/\"build-configuration\": \"AG_BUILD_CONFIGURATION\"/g" "${SRC}/package.json"
