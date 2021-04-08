#!/bin/bash

# After dependency installation ConverterTool binary will be copied to the `libs` directory
# to resolve its address via `app-pack` and pass to `safari-converter-lib`.

mkdir -p ../libs
cp node_modules/safari-converter-lib/bin/ConverterTool ../libs/ConverterTool
chmod +x ../libs/ConverterTool
rm -rf node_modules/safari-converter-lib/.build
