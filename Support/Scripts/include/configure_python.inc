# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

/usr/bin/python3 -m venv .venv
source .venv/bin/activate
# `python` -> `python3`, after activating virtual env
python -m pip install coloredlogs simplejson termcolor attrs parsy jinja2 requests
