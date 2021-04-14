#!/bin/bash
ls
bash ../Scripts/build-electron-app-one-arch.sh arm64
bash ../Scripts/build-electron-app-one-arch.sh x86_64
