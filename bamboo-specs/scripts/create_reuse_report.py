# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

import argparse
import json
import logging
import os
from enum import Enum
from pathlib import Path

DEFAULT_ENCODING = "UTF-8"

# Bitbucket API limitation: max 1,000 annotations per report
MAX_ANNOTATIONS = 1000


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


def get_args():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--report-path", type=Path, dest="report_path", help="Path to reuse lint report"
    )

    parser.add_argument(
        "--report-output-path",
        type=Path,
        dest="report_output_path",
        help="Path to base insight report",
    )

    parser.add_argument(
        "--annotations-output-path",
        type=Path,
        dest="annotations_output_path",
        help="Path to processed result",
    )

    return parser.parse_args()


def save_compact_json(path_: Path, data: dict) -> None:
    with open(path_, mode="w", encoding=DEFAULT_ENCODING) as f:
        f.write(json.dumps(data, separators=(",", ":")))


def process_report(
    report_path: Path,
    report_output_path: Path,
    annotations_output_path: Path,
):
    if not report_path or not report_path.exists():
        raise ValueError("Path to reuse lint report is not given")

    if not report_output_path:
        raise ValueError("Insight report output path is not given")

    if not annotations_output_path:
        raise ValueError("Annotations output path is not given")

    annotations = []
    is_passed = True

    report_json = json.loads(report_path.read_text())

    logging.info(f"Start processing reuse lint report: {report_path}")

    # Extract non_compliant section
    non_compliant = report_json.get("non_compliant", {})
    summary = report_json.get("summary", {})

    # Process bad licenses (HIGH severity)
    for license_id, files in (non_compliant.get("bad_licenses", {}) or {}).items():
        for file_path in files:
            severity = Severity.HIGH
            is_passed = False

            logging.warning(f"Bad license: {license_id}. File: {os.path.basename(file_path)}")

            annotations.append(
                {
                    "line": None,
                    "message": f"Bad license identifier: '{license_id}' is not a valid SPDX identifier",
                    "severity": severity.value,
                    "path": file_path,
                    "type": "VULNERABILITY",
                }
            )

    # Process missing licenses (HIGH severity)
    for license_id, files in (non_compliant.get("missing_licenses", {}) or {}).items():
        for file_path in files:
            severity = Severity.HIGH
            is_passed = False

            logging.warning(f"Missing license: {license_id}. File: {os.path.basename(file_path)}")

            annotations.append(
                {
                    "line": None,
                    "message": f"Missing license file: License '{license_id}' not found in LICENSES/ directory",
                    "severity": severity.value,
                    "path": file_path,
                    "type": "VULNERABILITY",
                }
            )

    # Process files without licenses (HIGH severity)
    for file_path in non_compliant.get("missing_licensing_info", []):
        severity = Severity.HIGH
        is_passed = False

        logging.warning(f"No license identifier. File: {os.path.basename(file_path)}")

        annotations.append(
            {
                "line": None,
                "message": "Missing SPDX-License-Identifier tag",
                "severity": severity.value,
                "path": file_path,
                "type": "VULNERABILITY",
            }
        )

    # Process files without copyright (HIGH severity)
    # In reuse 5.x this is called "missing_copyright_info"
    for file_path in non_compliant.get("missing_copyright_info", []):
        severity = Severity.HIGH
        is_passed = False

        logging.warning(f"No copyright notice. File: {os.path.basename(file_path)}")

        annotations.append(
            {
                "line": None,
                "message": "Missing SPDX-FileCopyrightText tag",
                "severity": severity.value,
                "path": file_path,
                "type": "VULNERABILITY",
            }
        )

    # Process read errors (HIGH severity)
    for file_path in non_compliant.get("read_errors", []):
        severity = Severity.HIGH
        is_passed = False

        logging.error(f"Read error. File: {os.path.basename(file_path)}")

        annotations.append(
            {
                "line": None,
                "message": "Cannot read file - check permissions",
                "severity": severity.value,
                "path": file_path,
                "type": "VULNERABILITY",
            }
        )

    # Process deprecated licenses (LOW severity)
    for license_id in non_compliant.get("deprecated_licenses", []):
        severity = Severity.LOW

        logging.info(f"Deprecated license: {license_id}")

        # Find files using this deprecated license
        # Note: reuse doesn't provide file mapping for deprecated licenses
        # We'll create a single annotation for the project
        annotations.append(
            {
                "line": None,
                "message": f"Deprecated SPDX license identifier: '{license_id}'. Consider updating to a current identifier",
                "severity": severity.value,
                "path": "LICENSES/",
                "type": "VULNERABILITY",
            }
        )

    logging.info(f"End reuse lint report processing")
    logging.info(f"Total annotations: {len(annotations)}")
    logging.info(f"Is compliant: {summary.get('compliant', False)}")

    # Apply Bitbucket API annotation limit
    total_annotations = len(annotations)
    truncated = False
    if total_annotations > MAX_ANNOTATIONS:
        logging.warning(
            f"Annotations count ({total_annotations}) exceeds Bitbucket limit ({MAX_ANNOTATIONS}). "
            f"Truncating to first {MAX_ANNOTATIONS} annotations."
        )
        annotations = annotations[:MAX_ANNOTATIONS]
        truncated = True
    
    logging.info(f"Annotations to be sent: {len(annotations)}")

    # Build report details with truncation info
    report_details = f"Total violations found: {total_annotations}"
    if truncated:
        report_details += f". Showing first {MAX_ANNOTATIONS} annotations due to Bitbucket API limit."
    
    # Build detailed report with statistics
    insight_report = {
        "title": "REUSE Compliance",
        "reporter": "reuse",
        "result": "PASS" if is_passed else "FAIL",
        "details": report_details,
    }

    save_compact_json(report_output_path, insight_report)
    save_compact_json(annotations_output_path, {"annotations": annotations})


if __name__ == "__main__":
    args = get_args()

    process_report(
        args.report_path,
        args.report_output_path,
        args.annotations_output_path,
    )
