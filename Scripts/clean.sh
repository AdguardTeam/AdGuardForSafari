#!/bin/bash

# cleans AdGuard for Safari temporary files for clean install

rm -r $HOME/Library/Group\ Containers/TC3Q7MAJXF.com.adguard.safari.AdGuard
rm -r $HOME/Library/Application\ Support/AdGuardSafariApp/
rm -r $HOME/Library/Preferences/com.adguard.safari.AdGuard.plist
rm -r $HOME/Library/Containers/com.adguard.safari.*
