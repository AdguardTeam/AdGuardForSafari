#!/usr/bin/python3

import os
import tempfile
import shutil
import json
from optparse import OptionParser

#
# Runtime variables
#
TEMP_DIR = tempfile.mkdtemp()
# Directory of this python file
CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))


def update_version(path, channel, version):
    print("Updating json file {0}".format(path))

    file = open(path, 'r')
    data = file.read()
    try:
        config_json = json.loads(data)
    except json.decoder.JSONDecodeError:
        print("Creating new json file..")
        config_json = {
            "darwin-x64-prod":
                {"readme": "Standalone release",
                 "update": "https://adguardteam.github.io/AdGuardForSafari/release/release.json",
                 "install": "https://static.adtidy.org/safari/release/AdGuard_Safari.app.zip",
                 "version": "1.4.1"},
            "darwin-x64-beta": {
                "readme": "Standalone beta",
                "update": "https://adguardteam.github.io/AdGuardForSafari/beta/release.json",
                "install": "https://static.adtidy.org/safari/beta/AdGuard_Safari_Beta.app.zip",
                "version": "1.4.1"}
        }

    prod_config = config_json["darwin-x64-prod"]
    beta_config = config_json["darwin-x64-beta"]

    if channel == "release":
        prod_config["version"] = version

    if channel == "beta":
        beta_config["version"] = version

    # props for arm64, otherwise updates are not working
    # props values are the same, since we have universal builds
    config_json["darwin-arm64-prod"] = prod_config
    config_json["darwin-arm64-beta"] = beta_config

    file = open(path, "w")
    file.write(json.dumps(config_json, indent=4))
    file.close()

    return


def main():
    parser = OptionParser()
    parser.add_option("-p", "--path", dest="path",
                      help="path to the file or app to notarize.")
    parser.add_option("-c", "--channel", dest="channel",
                      help="updates channel name")
    parser.add_option("-v", "--version", dest="version",
                      help="semantic version")

    # pylint: disable=unused-variable
    (options, args) = parser.parse_args()

    path = options.path
    if not path:
        parser.error("Path is not given")

    if not options.channel:
        parser.error("Channel is not given")

    if not options.version:
        parser.error("Version is not given")

    if not os.path.isabs(path):
        path = os.path.join(CURRENT_DIR, path)

    if not os.path.exists(path):
        raise ValueError("Cannot find json file: {0}".format(path))

    update_version(path, options.channel, options.version)
    return


# Entry point
try:
    main()
finally:
    shutil.rmtree(TEMP_DIR)
