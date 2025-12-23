<!--
SPDX-FileCopyrightText: AdGuard Software Limited
SPDX-License-Identifier: GPL-3.0-or-later
-->

# AGENTS

## Project Overview

This project contains platform part and UI part of application. Platform part is written on Swift and consist of main app and several Safari extensions. UI part is written on TypeScript and consist of several modules. UI part is based on Sciter runtime and uses Sciter dynamic libraries. UI modules are located in `AdguardMini/sciter-ui` directory and each module run separately. Userrules module is located in `AdguardMini/sciter-ui/modules/userrules` runs in Webview.

## Setup Commands

### Frontend
- Install dependencies: `yarn`
- Development build: `yarn build:dev`

### Platforn
- Open in Xcode and build app

## PR Instructions
- Title format: `AG-<task number>: <commit title in lowercase English>`

## Additional agent instructions
- Please check custom typescript types at `AdguardMini/sciter-ui/@types`, before any typescript files analysis.