# AdGuard Safari Application Extension

#### Requirements

- MacOS 10.13 or above
- Xcode 9.4 or above
- installed Xcode Command Line Tools
- [nodejs](https://nodejs.org/en/download/)
- [yarn](https://yarnpkg.com/en/docs/install/)
- [electron-packager](https://github.com/electron-userland/electron-packager)
- [node-gyp](https://github.com/nodejs/node-gyp)
- [electron-osx-sign](https://github.com/electron-userland/electron-osx-sign) 

Also read [Electron App README](./ElectronMainApp/README.md).

## Some tuning

In file `./AdGuard/Config.xcconfig` change AG_SIGN variable to appropriate value (your codesign identity).

## Input Point

Doubleclick on `AdGuard.xcworkspace` in Finder. 

