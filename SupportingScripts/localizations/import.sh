#!/bin/bash

#  importPlistLocalizations.sh
#  Adguard

mainWorkspace="AdGuard.xcworkspace"
projectRootFolder="Adguard"
PROJECT_TEMP_DIR="/tmp/dev/ios.com.adguard/import-script-tmp-dir"
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

# Project root directory
THEROOT="${SRCROOT}/Extension"

# XIB FILES LIST PATH
XIBFILESLIST="${SCRIPTDIR}/Resources/xib-files-list.txt"

####### Getting project locales

LOCALES=
for file in "${THEROOT}"/*.lproj; do
filename=$(basename "$file")
filename="${filename%.*}"
if [ "${filename}" != 'Base' ]; then
LOCALES="${LOCALES} ${filename}"
fi
done

####### Downloading XIB function
xibDownload()
{

filename=$(basename "${1}")
filename="${filename%.*}"
dir=$(dirname "${1}")

# LOCAL ROOT DIRECTORY
LOCALROOT=$(dirname "${dir}")
LOCALROOT="${SRCROOT}/${LOCALROOT}"

for locale in $LOCALES
do
echo "Download $filename for $locale locale"

python "${SCRIPTDIR}/Resources/download.py" -l $locale -o "${PROJECT_TEMP_DIR}/${locale}_${filename}" -f "${filename}.strings"
if [ $? == 0 ]; then
mv -vf "${PROJECT_TEMP_DIR}/${locale}_${filename}" "${LOCALROOT}/$locale.lproj/${filename}.strings"
fi
done

}

################################
echo "========================= UPDATING XIB FILES =============================="

while read -r -u 10 file; do
if [ "${file}" ]; then
xibDownload "${file}"
fi
done 10<${XIBFILESLIST}

if [ "${file}" ]; then
xibDownload "${file}"
fi

##############################
echo "========================= UPDATING STRING FILES =============================="

file="Localizable.strings"
action_file="ActionExtensionLocalizable.strings"
today_file="TodayExtensionLocalizable.strings"
for locale in $LOCALES
do
echo "Download Main Application Strings for $locale locale"
python "${SCRIPTDIR}/Resources/download.py" -l $locale -o "${PROJECT_TEMP_DIR}/${locale}_${file}" -f "${file}"
if [ $? == 0 ]; then
cp -fv "${PROJECT_TEMP_DIR}/${locale}_${file}" "${THEROOT}/$locale.lproj/$file"
rm "${PROJECT_TEMP_DIR}/${locale}_${file}"
fi
done

echo "Import finished"


##############################
echo "========================= UPDATING JavaScript FILES =============================="
cd "ElectronMainApp"

npm run download-locales

echo "Done"