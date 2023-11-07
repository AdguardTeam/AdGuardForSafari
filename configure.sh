#!/bin/bash
set -e

if [ "$1" == "dev" ]; then
    ENV_NAME=Development
else
    ENV_NAME=Production
fi
echo "==== Configure environment for: $ENV_NAME ===="
echo

bundle config --local path '.bundle/vendor'
bundle config 
bundle install

if [ "$1" == "dev" ]; then
    # syncs certificates for `MAS` distribution
    bundle exec fastlane certs config:Release --env dev
    # syncs certificates for `Stendalone`` distribution
    bundle exec fastlane certs config:Debug --env dev
fi
