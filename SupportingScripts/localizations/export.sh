#!/bin/bash

mainWorkspace="AdGuard.xcworkspace"
projectRootFolder="Adguard"
PROJECT_TEMP_DIR="/tmp/dev/ios.com.adguard/export-script-tmp-dir"
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
python "${SCRIPTDIR}/Resources/upload.py" -l en_US_POSIX -f "${FILE}" -r IOS_STRINGS
rm "${FILE}"
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
python "${SCRIPTDIR}/Resources/upload.py" -l en_US_POSIX -f "${EXTENSION}/Base.lproj/${file}" -r IOS_STRINGS

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
cp -fv "${EXTENSION}/en.lproj/${file}" "${PROJECT_TEMP_DIR}/extension_${file}"
python "${SCRIPTDIR}/Resources/upload.py" -l en_US_POSIX -f "${PROJECT_TEMP_DIR}/extension_${file}" -r IOS_STRINGS
# rm "${PROJECT_TEMP_DIR}/extension_${file}"

find "${BLOCKEREXTENSION}" -name \*.m | xargs genstrings -o "${BLOCKEREXTENSION}"
cp -fv "${BLOCKEREXTENSION}/en.lproj/${file}" "${PROJECT_TEMP_DIR}/blockerextension_${file}"
python "${SCRIPTDIR}/Resources/upload.py" -l en_US_POSIX -f "${PROJECT_TEMP_DIR}/blockerextension_${file}" -r IOS_STRINGS
# rm "${PROJECT_TEMP_DIR}/blockerextension_${file}"

find "${ADVANCED_BLOCKING_EXTENSION}" -name \*.m | xargs genstrings -o "${ADVANCED_BLOCKING_EXTENSION}"
cp -fv "${ADVANCED_BLOCKING_EXTENSION}/en.lproj/${file}" "${PROJECT_TEMP_DIR}/adv_blocking_extension_${file}"
sed -i "" "s/NSHumanReadableDescription/NSHumanReadableDescriptionAdvBlocking/g" "${PROJECT_TEMP_DIR}/adv_blocking_extension_${file}"
sed -i "" "s/CFBundleDisplayName/CFBundleDisplayNameAdvBlocking/g" "${PROJECT_TEMP_DIR}/adv_blocking_extension_${file}"
python "${SCRIPTDIR}/Resources/upload.py" -l en_US_POSIX -f "${PROJECT_TEMP_DIR}/adv_blocking_extension_${file}" -r IOS_STRINGS
# rm "${PROJECT_TEMP_DIR}/adv_blocking_extension_${file}"

echo "Done"
echo "Upload finished InfoPlist files"