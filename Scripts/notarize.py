#!/usr/bin/python3

import subprocess
import os
import tempfile
import shutil
import time
import json
from optparse import OptionParser

#
# Configuration
#
NOTARY_TIMEOUT = 60 * 30  # we will wait up to 30 minutes until notarization succeeds
DEVELOPMENT_TEAM = "TC3Q7MAJXF"  # Adguard Software Ltd.
DEVCONFIG_PATH = ".devconfig.json"

#
# Runtime variables
#
TEMP_DIR = tempfile.mkdtemp()
# Directory of this python file
CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))


def get_user_configuration():
    """Reads developer configuration
    """
    path = os.path.join(CURRENT_DIR, DEVCONFIG_PATH)
    if not os.path.exists(path):
        raise ValueError("{0} does not exist!".format(path))

    with open(path, 'r') as file:
        data = file.read()
        config_json = json.loads(data)
        username = config_json["AC_USERNAME"]
        keychain_record = config_json["AC_PASSWORD"]
        return (username, keychain_record)


def create_zip_archive(path):
    """Notary service accepts ZIP archives so we should prepare one
    """
    zip_path = os.path.join(TEMP_DIR, "to_notarize.zip")

    # Create a ZIP archive suitable for altool.
    result = subprocess.run([
        "/usr/bin/ditto",
        "-c", "-k", "--keepParent",
        path,
        zip_path
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        print("out: {0}".format(result.stdout))
        print("out: {0}".format(result.stderr))
        raise ChildProcessError("failed to find archive the archive")

    print("Archive for notary: {0}".format(zip_path))
    return zip_path


def wait_until_success(request_uuid):
    start_time = time.time()
    end_time = start_time + NOTARY_TIMEOUT

    while time.time() < end_time:
        # Waiting for 10 seconds before the next try
        time.sleep(10)
        status = get_notarization_info(request_uuid)
        print("Submission status: {0}".format(status))
        if status == "success":
            print("Notarization finished in {0} seconds".format(time.time() - start_time))
            return
        if status == "invalid":
            raise ChildProcessError("cannot notarize the archive")

    raise TimeoutError("Notary timeout has been exceeded")


def get_notarization_info(request_uuid):
    """Checks the status of the submission to the notary service

    Arguments:
    request_uuid -- ID of the submission
    """

    (account, keychain_record) = get_user_configuration()

    result = subprocess.run([
        "xcrun",
        "altool",
        "--notarization-info",
        request_uuid,
        "-u",
        account,
        "-p",
        "@keychain:{0}".format(keychain_record)
    ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if result.returncode != 0:
        print("out: {0}".format(result.stdout))
        raise ChildProcessError("failed to check the submission status")

    for line_bytes in result.stdout.splitlines():
        line = line_bytes.decode("utf-8").strip()
        if line.startswith("Status:"):
            parts = line.split(":", 2)
            status = parts[1].strip()
            return status

    print("out: {0}".format(result.stdout.decode("utf-8")))
    raise ChildProcessError("got invalid response from the notary service")


def submit_to_notary(path, bundle_id):
    """Submits the zip archive to the notary service.

    Returns RequestUUID that is necessary to staple the app once
    the notarization process is completed.
    """
    print("Submitting {0} to the notary service".format(path))
    (account, keychain_record) = get_user_configuration()

    result = subprocess.run([
        "xcrun",
        "altool",
        "--notarize-app",
        "--primary-bundle-id",
        bundle_id,
        "--asc-provider",
        DEVELOPMENT_TEAM,
        "-u",
        account,
        "-p",
        "@keychain:{0}".format(keychain_record),
        "-f",
        path,
        "-t",
        "osx"
    ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if result.returncode != 0:
        print("out: {0}".format(result.stdout))
        raise ChildProcessError("failed to submit the archive")

    for line_bytes in result.stdout.splitlines():
        line = line_bytes.decode("utf-8").strip()
        if line.startswith("RequestUUID"):
            parts = line.split("=", 2)
            request_uuid = parts[1].strip()
            return request_uuid

    print("out: {0}".format(result.stdout.decode("utf-8")))
    raise ChildProcessError("cannot find RequestUUID in the notary service response")


def notarize(path, bundle_id):
    """This function does the actual notary process

    Arguments:
    path -- path to the file or app to notarize
    """

    print("Start notarizing {0}".format(path))

    path_for_notary = path
    if os.path.isdir(path):
        path_for_notary = create_zip_archive(path)

    request_uuid = submit_to_notary(path_for_notary, bundle_id)
    print("Request UUID is {0}, now we wait for the notarization to complete".format(request_uuid))
    wait_until_success(request_uuid)

    print("Notarization is complete, now staple the app or file")

    result = subprocess.run([
        "xcrun",
        "stapler",
        "staple",
        path
    ],  stdout=subprocess.PIPE, stderr=subprocess.STDOUT)

    print("out: {0}".format(result.stdout.decode("utf-8")))

    if result.returncode != 0:
        raise ChildProcessError("failed to staple the archive")

    return


def main():
    parser = OptionParser()
    parser.add_option("-p", "--path", dest="path",
                      help="path to the file or app to notarize.")
    parser.add_option("-b", "--bundle-id", dest="bundle_id",
                      help="bundle ID for the notary service.")

    # pylint: disable=unused-variable
    (options, args) = parser.parse_args()

    path = options.path
    if not path:
        parser.error("Path is not given")

    if not options.bundle_id:
        parser.error("Bundle id is not given")

    if not os.path.isabs(path):
        path = os.path.join(CURRENT_DIR, path)

    if not os.path.exists(path):
        raise ValueError("Cannot find the file to notarize: {0}".format(path))

    notarize(path, options.bundle_id)
    return


# Entry point
try:
    main()
finally:
    shutil.rmtree(TEMP_DIR)