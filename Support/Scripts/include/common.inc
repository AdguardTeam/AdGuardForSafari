# SPDX-FileCopyrightText: AdGuard Software Limited
#
# SPDX-License-Identifier: GPL-3.0-or-later

PYTHON_VENV=".venv"
if [ "$ADGUARD_PYTHON_VENV" ]; then
    PYTHON_VENV="$ADGUARD_PYTHON_VENV"
fi
source "$PYTHON_VENV/bin/activate"
echo "Python virtual env activated on '$PYTHON_VENV'"
