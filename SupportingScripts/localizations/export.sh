#!/bin/bash

mainWorkspace="AdGuard.xcworkspace"
projectRootFolder="AdGuard"
PROJECT_TEMP_DIR="/tmp/dev/ios.com.adguard/export-script-tmp-dir"
SERVICE_URL="https://twosky.adtidy.org/api/v1/"
BASE_LOCALE="en"
#====================================================

usage()
{
    echo "Usage: $0 [directory with working tree]"
}

SCRIPTDIR="$( cd "$( dirname "$0" )" && pwd )"

if [ $1 ]
then cd $1
if [ ! $? == 0 ]; then
    echo "Can't change current dir to \"$1\""
    usage
    exit 1
fi
fi

SRCROOT="$( pwd )/${projectRootFolder}"

mkdir -pv "${PROJECT_TEMP_DIR}"

#Test SRCROOT
if [ ! -d "$mainWorkspace" ]; then
echo "Working directory does not contain \"${mainWorkspace}\"."
usage
exit 1
fi

# Project root directory of Extension
EXTENSION="${SRCROOT}/Extension"

# Project root directory of Blocker Extension
BLOCKEREXTENSION="${SRCROOT}/BlockerExtension"

# Project root directory of Advanced Blocking Extension
ADVANCED_BLOCKING_EXTENSION="${SRCROOT}/AdvancedBlocking"

BLOCKEREXTENSION_CUSTOM="${SRCROOT}/BlockerCustomExtension"
BLOCKEREXTENSION_OTHER="${SRCROOT}/BlockerOtherExtension"
BLOCKEREXTENSION_PRIVACY="${SRCROOT}/BlockerPrivacyExtension"
BLOCKEREXTENSION_SOCIAL="${SRCROOT}/BlockerSocialExtension"

# XIB FILES LIST PATH
XIBFILESLIST="${SCRIPTDIR}/Resources/xib-files-list.txt"

######### Uploading XIB function
xibUpload()
{

filename=$(basename "${1}")
filename="${filename%.*}"
dir=$(dirname "${1}")

echo "Uploading ${filename}.strings file for DEV locale"

# STRING FILE
FILE="${PROJECT_TEMP_DIR}/${filename}.strings"

# BASE DIRECTORY
THEBASE="${SRCROOT}/${dir}"

echo "File for processing:"
echo "${THEBASE}/${filename}.xib"

ibtool --generate-strings-file "${FILE}" "${THEBASE}/${filename}.xib"
curl -XPOST "${SERVICE_URL}upload" -F "format=strings" -F "language=en" -F "filename=${filename}.strings" -F "project=safari" -F "file=@${FILE}"
#rm "${FILE}"
}


echo "========================= UPLOAD XIB FILES =============================="
while read -r -u 10 file; do
if [ "${file}" ]; then
xibUpload "${file}"
fi
done 10<${XIBFILESLIST}

if [ "${file}" ]; then
xibUpload "${file}"
fi


echo "========================= UPLOAD STRING FILES =============================="

echo "Uploading Application Strings for DEV locale"
echo "Main App strings uploading.. "

file="Localizable.strings"
find "${EXTENSION}" -name \*.m | xargs genstrings -o "${EXTENSION}"
curl -XPOST "${SERVICE_URL}upload" -F "format=strings" -F "language=${BASE_LOCALE}" -F "filename=${file}" -F "project=safari" -F "file=@${EXTENSION}/${BASE_LOCALE}.lproj/${file}"

echo "Done"
echo "Upload finished Native string files"


echo "========================= UPLOAD JSON FILE =============================="

cd "ElectronMainApp"
npm run rebuild-locales
npm run upload-locales
cd ".."

echo "Done"
echo "Upload finished JavaScript files"


echo "========================= UPLOAD INFOPLIST FILE =============================="

file="InfoPlist.strings"
find "${EXTENSION}" -name \*.m | xargs genstrings -o "${EXTENSION}"
cp -fv "${EXTENSION}/${BASE_LOCALE}.lproj/${file}" "${PROJECT_TEMP_DIR}/${file}"
curl -XPOST "${SERVICE_URL}upload" -F "format=strings" -F "language=${BASE_LOCALE}" -F "filename=${file}" -F "project=safari" -F "file=@${PROJECT_TEMP_DIR}/${file}"
rm "${PROJECT_TEMP_DIR}/${file}"

find "${BLOCKEREXTENSION}" -name \*.m | xargs genstrings -o "${BLOCKEREXTENSION}"
cp -fv "${EXTENSION}/${BASE_LOCALE}.lproj/${file}" "${PROJECT_TEMP_DIR}/${file}"
curl -XPOST "${SERVICE_URL}upload" -F "format=strings" -F "language=${BASE_LOCALE}" -F "filename=blockerextension_${file}" -F "project=safari" -F "file=@${PROJECT_TEMP_DIR}/${file}"
rm "${PROJECT_TEMP_DIR}/${file}"

find "${BLOCKEREXTENSION_CUSTOM}" -name \*.m | xargs genstrings -o "${BLOCKEREXTENSION_CUSTOM}"
cp -fv "${EXTENSION}/${BASE_LOCALE}.lproj/${file}" "${PROJECT_TEMP_DIR}/${file}"
curl -XPOST "${SERVICE_URL}upload" -F "format=strings" -F "language=${BASE_LOCALE}" -F "filename=blockerextension_custom_${file}" -F "project=safari" -F "file=@${PROJECT_TEMP_DIR}/${file}"
rm "${PROJECT_TEMP_DIR}/${file}"

find "${BLOCKEREXTENSION_OTHER}" -name \*.m | xargs genstrings -o "${BLOCKEREXTENSION_OTHER}"
cp -fv "${EXTENSION}/${BASE_LOCALE}.lproj/${file}" "${PROJECT_TEMP_DIR}/${file}"
curl -XPOST "${SERVICE_URL}upload" -F "format=strings" -F "language=${BASE_LOCALE}" -F "filename=blockerextension_other_${file}" -F "project=safari" -F "file=@${PROJECT_TEMP_DIR}/${file}"
rm "${PROJECT_TEMP_DIR}/${file}"

find "${BLOCKEREXTENSION_PRIVACY}" -name \*.m | xargs genstrings -o "${BLOCKEREXTENSION_PRIVACY}"
cp -fv "${EXTENSION}/${BASE_LOCALE}.lproj/${file}" "${PROJECT_TEMP_DIR}/${file}"
curl -XPOST "${SERVICE_URL}upload" -F "format=strings" -F "language=${BASE_LOCALE}" -F "filename=blockerextension_privacy_${file}" -F "project=safari" -F "file=@${PROJECT_TEMP_DIR}/${file}"
rm "${PROJECT_TEMP_DIR}/${file}"

find "${BLOCKEREXTENSION_SOCIAL}" -name \*.m | xargs genstrings -o "${BLOCKEREXTENSION_SOCIAL}"
cp -fv "${EXTENSION}/${BASE_LOCALE}.lproj/${file}" "${PROJECT_TEMP_DIR}/${file}"
curl -XPOST "${SERVICE_URL}upload" -F "format=strings" -F "language=${BASE_LOCALE}" -F "filename=blockerextension_social_${file}" -F "project=safari" -F "file=@${PROJECT_TEMP_DIR}/${file}"
rm "${PROJECT_TEMP_DIR}/${file}"

find "${ADVANCED_BLOCKING_EXTENSION}" -name \*.m | xargs genstrings -o "${ADVANCED_BLOCKING_EXTENSION}"
cp -fv "${EXTENSION}/${BASE_LOCALE}.lproj/${file}" "${PROJECT_TEMP_DIR}/${file}"
curl -XPOST "${SERVICE_URL}upload" -F "format=strings" -F "language=${BASE_LOCALE}" -F "filename=adv_blocking_extension_mod_${file}" -F "project=safari" -F "file=@${PROJECT_TEMP_DIR}/${file}"
rm "${PROJECT_TEMP_DIR}/${file}"

echo "Done"
echo "Upload finished InfoPlist files"