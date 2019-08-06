#!/usr/bin/python3

import os
import sys
import subprocess
import tempfile
import shutil
import requests
import json

#
# Configuration
#
API_UPLOAD_URL = "https://twosky.adtidy.org/api/v1/upload"
API_DOWNLOAD_URL = "https://twosky.adtidy.org/api/v1/download"
API_PROJECTID = "safari"
API_BASELOCALE = "en"
# Base directory of the project files
BASE_PATH = "../Adguard"

#
# Locales we support in the app
#
LOCALES = []
LOCALES.append("en")  # English, base language
LOCALES.append("cs")  # Chech
LOCALES.append("da")  # Danish
LOCALES.append("de")  # German
LOCALES.append("es")  # Spanish
LOCALES.append("fr")  # French
LOCALES.append("it")  # Italian
LOCALES.append("ja")  # Japanese
LOCALES.append("pl")  # Polish
LOCALES.append("pt-BR")  # Portuguese (Brazil)
LOCALES.append("pt-PT")  # Portuguese
LOCALES.append("ru")  # Russian
LOCALES.append("sv")  # Sweden
LOCALES.append("tr")  # Turkish
LOCALES.append("zh-Hans")  # Chinese Simplified (mainland China)
LOCALES.append("zh-Hant")  # Chinese Traditional (Taiwan)

#
# This is the list of non-XIB files to localize.
# Keep this list up-to-date
#
LOCALIZABLE_FILES = []
LOCALIZABLE_FILES.append("Extension/Base.lproj/Localizable.strings")
LOCALIZABLE_FILES.append("Extension/Base.lproj/InfoPlist.strings")
LOCALIZABLE_FILES.append("AdvancedBlocking/en.lproj/InfoPlist.strings")
LOCALIZABLE_FILES.append("BlockerCustomExtension/en.lproj/InfoPlist.strings")
LOCALIZABLE_FILES.append("BlockerExtension/en.lproj/InfoPlist.strings")
LOCALIZABLE_FILES.append("BlockerOtherExtension/en.lproj/InfoPlist.strings")
LOCALIZABLE_FILES.append("BlockerPrivacyExtension/en.lproj/InfoPlist.strings")
LOCALIZABLE_FILES.append("BlockerSecurityExtension/en.lproj/InfoPlist.strings")
LOCALIZABLE_FILES.append("BlockerSocialExtension/en.lproj/InfoPlist.strings")

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
JSON_FILES.append("../ElectronMainApp/locales")

#
# This is the list of XIB files to localize.
# Keep this list up-to-date
#
XIB_FILES = []
XIB_FILES.append("Extension/Base.lproj/SafariExtensionViewController.xib")

#
# Runtime variables
#
TEMP_DIR = tempfile.mkdtemp()
# Directory of this python file
CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))


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
        "project": API_PROJECTID
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
        "project": API_PROJECTID,
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


def export_localizable_file(path, locale):
    """Uploads the specified localizable file to the translation system"""
    print("Exporting {0}".format(path))

    if not os.path.exists(path):
        raise FileNotFoundError(path)

    file_name = os.path.basename(path)
    file_ext = os.path.splitext(file_name)[1][1:]

    if file_name == "InfoPlist.strings":
        extension_name = os.path.dirname(path)
        file_name = INFO_PLIST_DICTIONARY[extension_name]

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


def import_localizable_file(path, locale):
    """Imports the specified localizable file from the translation system"""
    print("Importing {0}".format(path))

    file_name = os.path.basename(path)
    file_ext = os.path.splitext(file_name)[1][1:]

    if file_name == "InfoPlist.strings":
        extension_name = os.path.dirname(path)
        file_name = INFO_PLIST_DICTIONARY[extension_name]

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
        file_path = os.path.join(CURRENT_DIR, BASE_PATH, "{0}.lproj".format(API_BASELOCALE), path)
        export_localizable_file(file_path, API_BASELOCALE)

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
    for locale in LOCALES:
        export_translations(locale)
    print("Finihed exporting ALL translations")
    return


def import_localization(locale):
    """Imports translations to the specified language"""
    print("Start importing translations to {0}".format(locale))

    for path in XIB_FILES:
        translation_path = get_xib_translation_path(path, locale)
        file_path = os.path.join(CURRENT_DIR, BASE_PATH, translation_path)
        import_localizable_file(file_path, locale)

    for path in LOCALIZABLE_FILES:
        file_path = os.path.join(CURRENT_DIR, BASE_PATH, "{0}.lproj".format(locale), path)
        import_localizable_file(file_path, locale)

    for path in JSON_FILES:
        file_path = os.path.join(CURRENT_DIR, BASE_PATH, path, "{0}.json".format(locale))
        import_json_file(file_path, locale)

    print("Finished importing translations to {0}".format(locale))
    return


def import_localizations():
    """Entry point for the importing localizations process"""
    print("Start importing localizations")
    for locale in LOCALES:
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
        if LOCALES.index(locale) == -1:
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