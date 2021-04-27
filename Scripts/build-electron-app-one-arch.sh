#!/bin/bash

echo "Building electron app with config:"
echo "CONFIGURATION: ${CONFIGURATION}"
echo "AG_STANDALONE: ${AG_STANDALONE}"
echo "AG_STANDALONE_BETA: ${AG_STANDALONE_BETA}"

# Fix nvm incompatibility
. ~/.nvm/nvm.sh
nvm use v13.10.0 || exit 1

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

mkdir -vp "${SRC}/safari-ext/shared"
cp -v "${BUILT_PRODUCTS_DIR}/libshared.a" "${SRC}/safari-ext/shared/" || exit 1
rsync -avm --include='*.h' -f 'hide,! */' "${SHAREDSRC}/" "${SRC}/safari-ext/shared/"

# Update package.json
sed -i "" "s/AG_STANDALONE_BETA/${AG_STANDALONE_BETA}/g" "${SRC}/package.json"
sed -i "" "s/AG_STANDALONE_BUILD/${AG_STANDALONE}/g" "${SRC}/package.json"
sed -i "" "s/AG_BUILD_CONFIGURATION/${CONFIGURATION}/g" "${SRC}/package.json"

# Rebuild electron app
OPT=""
cd "${SRC}"
OPT="--asar"
yarn install --force || exit 1

# Copy converter binary
mkdir -p ../libs
cp node_modules/safari-converter-lib/bin/ConverterTool ../libs
chmod +x ../libs/ConverterTool

# Extract Electron version
ELECTRON_VERSION=$(jq -r ".devDependencies.electron" ../ElectronMainApp/package.json)

# Remove prefix "^"
ELECTRON_VERSION=${ELECTRON_VERSION#"^"}

# Rebuild safari-ext and other node packages
yarn electron-rebuild --arch=${ARCH} -v ${ELECTRON_VERSION}

if [[ ${CONFIGURATION} == "Release" ]]; then
    echo "Building release MAS version"

    OPT="--asar.unpack=*.node"

    electron-packager "${SRC}" "${PRODUCT_NAME}" --electron-version=${ELECTRON_VERSION} --platform=${PLATFORM} --app-bundle-id="${AG_BUNDLEID}" \
    --arch=x64 --arch=arm64  --app-version="${AG_VERSION}"  --build-version="${AG_BUILD}" --prune=true --overwrite --out="${2}" --osx-sign=false \
    ${OPT} || exit 1

    APP="${2}/${PRODUCT_NAME}-${PLATFORM}-${ARCH}/${PRODUCT_NAME}.app"
    FRAMEWORKS="${APP}/Contents/Frameworks"

    # electron-packager produces additional login helper, that we don't need
    # https://github.com/AdguardTeam/AdGuardForSafari/issues/204
    rm -r "${APP}/Contents/Library/LoginItems/${PRODUCT_NAME} Login Helper.app" || exit 1

else
    OPT="--asar.unpack=*.node"
    # run electron-packager for both architectures to get similar asar files in universal build
    # to be able to get rid of redundant asar files later
    ARCHS="--arch=x64 --arch=arm64"

    PACKAGER_PLATFORM="mas"
    if [[ ${AG_STANDALONE} == "true" ]]; then
      echo "Changing standalone build platform"
      PACKAGER_PLATFORM="darwin"
    fi

    electron-packager "${SRC}" "${PRODUCT_NAME}" --electron-version=${ELECTRON_VERSION} --platform=${PACKAGER_PLATFORM} --app-bundle-id="${AG_BUNDLEID}" \
    ${ARCHS} --app-version="${AG_VERSION}"  --build-version="${AG_BUILD}" --prune=true --overwrite --out="${2}" --osx-sign=false \
    ${OPT} || exit 1

    APP="${2}/${PRODUCT_NAME}-${PACKAGER_PLATFORM}-${ARCH}/${PRODUCT_NAME}.app"
    FRAMEWORKS="${APP}/Contents/Frameworks"
    RESOURCES="${APP}/Contents/Resources"
fi

# Remove redundant signatures
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

#  Touch native part of the project
touch -c "${SRCROOT}/Assets.xcassets"
touch -c "${SRCROOT}/AdGuard/Info.plist"
touch -c "${SRCROOT}/defaults.plist"

# Update package.json
sed -i "" "s/\"standalone-build\": \"${AG_STANDALONE}\"/\"standalone-build\": \"AG_STANDALONE_BUILD\"/g" "${SRC}/package.json"
sed -i "" "s/\"standalone-beta\": \"${AG_STANDALONE_BETA}\"/\"standalone-beta\": \"AG_STANDALONE_BETA\"/g" "${SRC}/package.json"
sed -i "" "s/\"build-configuration\": \"${CONFIGURATION}\"/\"build-configuration\": \"AG_BUILD_CONFIGURATION\"/g" "${SRC}/package.json"
