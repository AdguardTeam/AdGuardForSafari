#!/usr/bin/python3

import os
import sys
import subprocess
import tempfile
import shutil
import requests
import json
import glob

#
# Runtime variables
#
TEMP_DIR = tempfile.mkdtemp()
# Directory of this python file
CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))

#
# Configuration
#
API_UPLOAD_URL = "https://twosky.adtidy.org/api/v1/upload"
API_DOWNLOAD_URL = "https://twosky.adtidy.org/api/v1/download"
# Base directory of the project files
BASE_PATH = "../Adguard"

# Loads twosky configuration from .twosky.json.
# This configuration file contains:
# * languages -- the list of languages we support
# * project_id -- twosky project ID
# * base_locale -- base language of our app
# * localizable_files -- list of localizable files masks
with open(os.path.join(CURRENT_DIR, "../.twosky.json"), 'r') as f:
    TWOSKY_CONFIG = json.load(f)[0]

API_BASELOCALE = TWOSKY_CONFIG["base_locale"]
#
# This is the list of non-XIB files to localize.
#
LOCALIZABLE_FILES = []
for path in TWOSKY_CONFIG["localizable_files"]:
    LOCALIZABLE_FILES.append(path)


#
# In case we have to use many InfoPlist.strings files we have to rename.
#
INFO_PLIST_DICTIONARY = {
    'Extension' : 'InfoPlist.strings',
    'AdvancedBlocking' : 'adv_blocking_extension_mod_InfoPlist.strings',
    'BlockerCustomExtension' : 'blockerextension_custom_InfoPlist.strings',
    'BlockerExtension' : 'blockerextension_InfoPlist.strings',
    'BlockerOtherExtension' : 'blockerextension_other_InfoPlist.strings',
    'BlockerPrivacyExtension' : 'blockerextension_privacy_InfoPlist.strings',
    'BlockerSecurityExtension' : 'blockerextension_security_InfoPlist.strings',
    'BlockerSocialExtension' : 'blockerextension_social_InfoPlist.strings'
}

#
# This is the list of json files to localize.
# Keep this list up-to-date
#
JSON_FILES = []
for path in TWOSKY_CONFIG["json_files"]:
    JSON_FILES.append(path)

#
# This is the list of XIB files to localize.
# Keep this list up-to-date
#
XIB_FILES = []
for path in TWOSKY_CONFIG["xib_files"]:
    XIB_FILES.append(path)

def changeEncoding(file):
    print("change encoding of file {0} from utf-16 to utf-8".format(file))
    """ Changes encoding of file from UTF-16 to UTF-8 
    """
    with open(file, "rb") as f:
        with open("temp.strings", "wb") as f2:
            content = f.read().decode('utf-16')
            f2.write(content.lstrip().encode('utf-8'))
    os.rename("temp.strings", file)

def upload_file(path, format, language, file_name):
    """Uploads the specified file to the translation API

    Arguments:
    path -- path to the file to upload
    format -- format of the file (for instance, 'strings' or 'json')
    language -- file language
    file_name -- name of the file in the translation system
    """
    files = {"file": open(path, "rb")}
    values = {
        "format": format,
        "language": language,
        "filename": file_name,
        "project": TWOSKY_CONFIG["project_id"]
    }

    print("Uploading {0}/{1} to the translation system".format(language, file_name))
    result = requests.post(API_UPLOAD_URL, files=files, data=values)
    result_text = result.text

    if result.status_code != 200:
        raise ConnectionError("Could not upload. Response status={0}\n{1}".format(result.status_code, result_text))

    print("Response: {0}".format(result_text))
    result_json = json.loads(result_text)
    if result_json['ok'] != True:
        raise ConnectionError("Could not upload. Response status={0}\n{1}".format(result.status_code, result_text))
    return


def download_file(file_name, language, format, path):
    """Downloads the specified file from the translations system

    Arguments:
    file_name -- name of the file in the translations system
    language -- language to download
    format -- format of the file (for instance, 'strings' or 'json')
    path -- destination path where the file is to be written
    """
    print("Downloading {0}/{1} from the translation system".format(language, file_name))

    params = {
        "filename": file_name,
        "format": format,
        "project": TWOSKY_CONFIG["project_id"],
        "language": language
    }
    result = requests.get(API_DOWNLOAD_URL, params=params)
    if result.status_code != 200:
        raise ConnectionError("Could not download. Response status={0}\n{1}".format(result.status_code, result.text))

    target_dir = os.path.dirname(path)
    if not os.path.exists(target_dir):
        raise ValueError(
            "Target directory does not exist: {0}, make sure that you've added this language in XCode".format(target_dir))

    file = open(path, "wb")
    file.write(result.content)
    file.close()
    print("The file was downloaded to {0}".format(path))
    return


def xib_to_strings(xib_path, strings_path):
    """Generates a strings file from the specified xib"""
    print("Generating {0} file from {1}".format(strings_path, xib_path))
    result = subprocess.run([
        "ibtool",
        "--generate-strings-file",
        strings_path,
        xib_path
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if len(result.stdout) > 0:
        print("ibtool stdout:\n{0}".format(result.stdout))

    if len(result.stderr) > 0:
        print("ibtool stderr:\n{0}".format(result.stderr))

    if result.returncode != 0:
        raise ChildProcessError(
            "failed to generate the .strings file from {0}. Return code {1}.".format(xib_path, result.returncode))

    if not os.path.exists(strings_path):
        raise FileNotFoundError(strings_path)

    changeEncoding(strings_path)

    # Finished generating strings
    return


def strings_to_xib(strings_path, xib_path):
    """Imports strings from the .strings file to the specified .xib"""
    print("Importing strings from {0} to {1}".format(strings_path, xib_path))

    result = subprocess.run([
        "ibtool",
        "--import-strings-file",
        strings_path,
        xib_path,
        "--write",
        xib_path
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if len(result.stdout) > 0:
        print("ibtool stdout:\n{0}".format(result.stdout))

    if len(result.stderr) > 0:
        print("ibtool stderr:\n{0}".format(result.stderr))

    if result.returncode != 0:
        raise ChildProcessError(
            "failed to import strings from {0}. Return code {1}.".format(strings_path, result.returncode))

    # Finished importing strings
    return


def export_xib(path):
    """Uploads the specified XIB file to the translation system.
    This method first converts the file to the .strings format,
    and then uploads it to the translation system.
    """
    print("Exporting {0}".format(path))

    if not os.path.exists(path):
        raise FileNotFoundError(path)

    file_name = os.path.basename(path)
    file_name_noext = os.path.splitext(file_name)[0]
    strings_file_name = "{0}.strings".format(file_name_noext)
    strings_path = os.path.join(TEMP_DIR, strings_file_name)

    # Now we should generate a `.strings` file from this XIB
    xib_to_strings(path, strings_path)

    # Now that strings file is generated, we can upload it
    upload_file(strings_path, "strings", API_BASELOCALE, strings_file_name)
    return


def export_localizable_file(path, locale, dir_name):
    """Uploads the specified localizable file to the translation system"""
    print("Exporting {0}".format(path))

    if not os.path.exists(path):
        raise FileNotFoundError(path)

    file_name = os.path.basename(path)
    file_ext = os.path.splitext(file_name)[1][1:]

    if file_name == "InfoPlist.strings":
        file_name = INFO_PLIST_DICTIONARY[dir_name]

    # Now upload the file
    upload_file(path, file_ext, locale, file_name)
    return


def export_json_file(path, locale):
    """Uploads the specified json file to the translation system"""
    print("Exporting {0}".format(path))

    if not os.path.exists(path):
        raise FileNotFoundError(path)

    file_name = "en.json"
    file_ext = os.path.splitext(file_name)[1][1:]

    # Now upload the file
    upload_file(path, file_ext, locale, file_name)
    return


def import_localizable_file(path, locale, dir_name):
    """Imports the specified localizable file from the translation system"""
    print("Importing {0}".format(path))

    file_name = os.path.basename(path)
    file_ext = os.path.splitext(file_name)[1][1:]

    if file_name == "InfoPlist.strings":
        file_name = INFO_PLIST_DICTIONARY[dir_name]

    # Download the file
    download_file(file_name, locale, file_ext, path)
    return

def import_json_file(path, locale):
    """Imports the specified json file from the translation system"""
    print("Importing {0}".format(path))

    file_name = "en.json"
    file_ext = os.path.splitext(file_name)[1][1:]

    # Download the file
    download_file(file_name, locale, file_ext, path)
    return

def workaround_json_file(file_path, locale, path):
    """We don't have some locales in xcode, but we need it for Electron, such as zh-cn, zh-tw
    So we gonna duplicate these files
    Referenced issue: https://github.com/AdguardTeam/AdGuardForSafari/issues/256
    """

    ELECTRON_LOCALES_DICTIONARY = {
        'zh-Hans' : 'zh-cn',
        'zh-Hant' : 'zh-tw'
    }

    paired_locale = ELECTRON_LOCALES_DICTIONARY.get(locale, '')
    if paired_locale != "":
        print("Duplicate json for {0} - {1}".format(locale, paired_locale))
        copy_path = os.path.join(CURRENT_DIR, BASE_PATH, path, "{0}.json".format(paired_locale))
        shutil.copyfile(file_path, copy_path)

    return


def get_xib_translation_path(path, locale):
    """Gets path to the XIB file translation given it's relative path

    For example, if path is 'ProgramLog/Base.lproj/AAProgramLog.xib' and locale is 'de',
    the translation path will be 'ProgramLog/de.lproj/AAProgramLog.strings'
    """

    path = path.replace("Base.lproj", "{0}.lproj".format(locale))
    path = os.path.splitext(path)[0] + ".strings"
    return path


def export_localizations():
    """Entry point for the exporting localizations process"""
    print("Start exporting localizations")

    for path in XIB_FILES:
        file_path = os.path.join(CURRENT_DIR, BASE_PATH, path)
        export_xib(file_path)

    for path in LOCALIZABLE_FILES:
        file_name = os.path.basename(path)
        dir_name = os.path.dirname(path)
        file_path = os.path.join(CURRENT_DIR, BASE_PATH, dir_name, "{0}.lproj".format(API_BASELOCALE), file_name)
        export_localizable_file(file_path, API_BASELOCALE, dir_name)

    for path in JSON_FILES:
        file_path = os.path.join(CURRENT_DIR, BASE_PATH, path, "{0}.json".format(API_BASELOCALE))
        export_json_file(file_path, API_BASELOCALE)

    print("Finished exporting localizations")
    return


def export_translations(locale):
    """Exports all existing translations to the specified locale
    to the translation system."""
    print("Start exporting translations to {0}".format(locale))

    for path in XIB_FILES:
        translation_path = get_xib_translation_path(path, locale)
        file_path = os.path.join(CURRENT_DIR, BASE_PATH, translation_path)
        export_localizable_file(file_path, locale)

    for path in LOCALIZABLE_FILES:
        file_path = os.path.join(CURRENT_DIR, BASE_PATH, "{0}.lproj".format(locale), path)
        export_localizable_file(file_path, locale)

    for path in JSON_FILES:
        file_path = os.path.join(CURRENT_DIR, BASE_PATH, path, "{0}.json".format(locale))
        export_json_file(file_path, locale)

    print("Finished exporting translations to {0}".format(locale))
    return


def export_all_translations():
    """Entry point for the exporting ALL translations process"""
    print("Start exporting ALL translations")
    for locale in TWOSKY_CONFIG["languages"]:
        export_translations(locale)
    print("Finihed exporting ALL translations")
    return


def import_localization(locale):
    """Imports translations to the specified language"""
    print("Start importing translations to {0}".format(locale))

    for path in XIB_FILES:
        translation_path = get_xib_translation_path(path, locale)
        file_path = os.path.join(CURRENT_DIR, BASE_PATH, translation_path)
        import_localizable_file(file_path, locale, "")

    for path in LOCALIZABLE_FILES:
        file_name = os.path.basename(path)
        dir_name = os.path.dirname(path)
        file_path = os.path.join(CURRENT_DIR, BASE_PATH, dir_name, "{0}.lproj".format(locale), file_name)
        import_localizable_file(file_path, locale, dir_name)

    for path in JSON_FILES:
        file_path = os.path.join(CURRENT_DIR, BASE_PATH, path, "{0}.json".format(locale))
        import_json_file(file_path, locale)
        workaround_json_file(file_path, locale, path)

    print("Finished importing translations to {0}".format(locale))
    return


def import_localizations():
    """Entry point for the importing localizations process"""
    print("Start importing localizations")
    for locale in TWOSKY_CONFIG["languages"]:
        import_localization(locale)
    print("Finished importing localizations")
    return


def update_strings():
    """Entry point for the updating strings from xibs process"""
    print("Start updating .strings files")

    for path in XIB_FILES:
        strings_rel_path = get_xib_translation_path(path, API_BASELOCALE)
        strings_path = os.path.join(CURRENT_DIR, BASE_PATH, strings_rel_path)
        xib_path = os.path.join(CURRENT_DIR, BASE_PATH, path)
        xib_to_strings(xib_path, strings_path)

    print("Finished updating .strings files")
    return


def update_xibs():
    """Entry point for the updating xibs from strings process"""
    print("Start updating .xib files")

    for path in XIB_FILES:
        strings_rel_path = get_xib_translation_path(path, API_BASELOCALE)
        strings_path = os.path.join(CURRENT_DIR, BASE_PATH, strings_rel_path)
        xib_path = os.path.join(CURRENT_DIR, BASE_PATH, path)
        strings_to_xib(strings_path, xib_path)

    print("Finished updating .xib files")
    return


def print_usage():
    print("Usage:")
    print("python localization.py argument")
    print("argument: can be '--export', '--export-all', '--import', '--update-xib', or '--update-strings'")
    return


def main():
    if len(sys.argv) != 2:
        print_usage()
        return

    command = sys.argv[1]

    if command == "--export":
        export_localizations()
    elif command == "--export-all":
        export_all_translations()
    elif command == "--import":
        import_localizations()
    elif command.startswith("--import="):
        parts = command.split("=", 2)
        locale = parts[1]
        if not locale in TWOSKY_CONFIG["languages"]:
            raise ValueError("Invalid locale: {0}".format(locale))
        import_localization(locale)
    elif command == "--update-strings":
        update_strings()
    elif command == "--update-xib":
        update_xibs()
    else:
        print_usage()


# Entry point
try:
    main()
finally:
    shutil.rmtree(TEMP_DIR)