#!/bin/bash

set -e

# copy scriptlets.js
cp node_modules/@adguard/scriptlets/dist/scriptlets.js ../AdGuard/AdvancedBlocking

# copy extended-css.js
cp node_modules/@adguard/extended-css/dist/extended-css.js ../AdGuard/AdvancedBlocking

# copy assistant.embedded.js
cp node_modules/@adguard/assistant/dist/assistant.js ../AdGuard/Extension/assistant.embedded.js
