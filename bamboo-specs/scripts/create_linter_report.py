# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

import argparse
import json
import logging
import os
from enum import Enum
from pathlib import Path
from types import SimpleNamespace

DEFAULT_ENCODING = "UTF-8"


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


RULE_SEVERITY_MAP = {
    "file_length": Severity.LOW,
    "todo_jira": Severity.MEDIUM,
    "": Severity.HIGH,
}


def get_args():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--root-path",
        type=Path,
        dest="root_path",
        help="Path to repo root. Used to create relative paths for a report.",
    )

    parser.add_argument(
        "--report-path", type=Path, dest="report_path", help="Path to swiftlint report"
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


def get_severity(rule_id: str):
    return RULE_SEVERITY_MAP.get(rule_id, Severity.HIGH)


def get_line(rule_id: str, line: int):
    if rule_id == "file_length":
        return None

    return line


def save_compact_json(path_: Path, data: "dict") -> None:
    with open(path_, mode="w", encoding=DEFAULT_ENCODING) as f:
        f.write(json.dumps(data, separators=(",", ":")))


def process_report(
    report_path: Path,
    root_path: Path,
    report_output_path: Path,
    annotations_output_path: Path,
):
    if not report_path or not report_path.exists():
        raise ValueError("Path to swiftlint report is not given")

    if not root_path or not root_path.exists():
        raise ValueError("Path to repo root is not given")

    if not report_output_path:
        raise ValueError("Insight report output path is not given")

    if not annotations_output_path:
        raise ValueError("Annotations output path is not given")

    annotations = []
    is_passed = True

    annotations_json = json.loads(report_path.read_text())

    logging.info(f"Start process swiftlint report: {report_path}")
    for json_obj in annotations_json:
        obj = SimpleNamespace(**json_obj)
        severity = get_severity(obj.rule_id)
        if severity == Severity.HIGH:
            logging.warning(f"Critical rule id: {obj.rule_id}. File: {os.path.basename(os.path.normpath(obj.file))}:{obj.line}")

        if is_passed:
            is_passed = severity != Severity.HIGH

        annotations.append(
            {
                "line": get_line(obj.rule_id, obj.line),
                "message": f"{obj.type}. {obj.reason}",
                "severity": severity.value,
                "path": os.path.relpath(obj.file, root_path),
                "type": "CODE_SMELL",
            }
        )
    logging.info(f"End swiftlint report processing")

    insight_report = {
        "title": "Codestyle report",
        "reporter": "swiftlint",
        "result": "PASS" if is_passed else "FAIL",
    }

    save_compact_json(report_output_path, insight_report)

    save_compact_json(annotations_output_path, {"annotations": annotations})


if __name__ == "__main__":
    args = get_args()

    process_report(
        args.report_path,
        args.root_path,
        args.report_output_path,
        args.annotations_output_path,
    )
