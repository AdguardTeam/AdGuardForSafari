&nbsp;
<p align="center">
  <img src="https://cdn.adguard.com/public/Adguard/Common/adguard_safari.svg" width="300px" alt="AdGuard for Safari" />
</p>
<h3 align="center">The most advanced ad blocking extension for Safari</h3>
<p align="center">
  Free and open source, highly customizable and lightning fast ad blocking extension.
</p>

<p align="center">
    <a href="https://adguard.com/">AdGuard.com</a> |
    <a href="https://reddit.com/r/Adguard">Reddit</a> |
    <a href="https://twitter.com/AdGuard">Twitter</a> |
    <a href="https://t.me/adguard_en">Telegram</a>
    <br /><br />
    <a href="https://agrd.io/safari">
        <img src="https://img.shields.io/badge/download-app%20store-blue.svg" alt="Download on the AppStore" />
    </a>
    <a href="https://github.com/AdguardTeam/AdguardForSafari/releases">
        <img src="https://img.shields.io/github/release/AdguardTeam/AdguardForSafari/all.svg" alt="Latest release" />
    </a>
</p>

<br />

<p align="center">
    <img src="https://cdn.adguard.com/public/Adguard/Blog/Safari_Ext_AppStore/Preferences_Filters.jpg" width="800" />
</p>

<hr />

# AdGuard for Safari

Ad blocking extensions for Safari are having hard time since Apple [started to force everyone](https://adguard.com/en/blog/safari-adblock-extensions/) to use the new SDK. AdGuard extension is supposed to bring back the high quality ad blocking back to Safari.

Unlike other major ad blockers, AdGuard provides some extra features you are used to have with the traditional (now deprecated) extensions:

* Managing protection from Safari
* Choose among popular filter subscription
* Custom filters
* Creating your own filtering rules
* Manual blocking tool
* Whitelisting websites

AdGuard for Safari is based on the Safari native content blocking API, which makes it lightning fast, but somewhat limited in capabilities. For instance, Safari limits the number of rules a content blocker can have.

## Better yet, there is a full-fledged AdGuard for Mac

With all above said, there is a solution that is even more effective than AG Safari extension. I mean, of course, [AdGuard for Mac](https://adguard.com/adguard-mac/overview.html). It can:

* filter your traffic in all browsers and apps on your Mac
* have an unlimited number of filter rules
* provide a better filtering quality (due to the lack of browser API restrictions)

You can [try it out for free](https://adguard.com/en/download.html?os=mac&show=1).

## How to build AdGuard for Safari

AdGuard for Safari consists of three parts:

* An [Electron](https://electronjs.org/) application.
* Safari Content Blocker extension
* Safari Toolbar icon extension

### Prerequisites

- MacOS 10.13 or above
- [Xcode](https://developer.apple.com/xcode/) 9.4 or above
- Xcode Command Line Tools
- [Node.js](https://nodejs.org/) v8.9.4 or higher
- [Yarn](https://yarnpkg.com/lang/en/)

Also, you need to install these packages globally:

- [electron-packager](https://github.com/electron-userland/electron-packager)
- [node-gyp](https://github.com/nodejs/node-gyp)
- [electron-osx-sign](https://www.npmjs.com/package/electron-osx-sign)

```
npm install -g electron-packager 
npm install -g node-gyp 
npm install -g electron-osx-sign
```

## How to build 

### To run application in development mode 

```
cd ElectronMainApp
```

Install local dependencies by runnning:

```
yarn install
```

### How to debug the app

#### Debug window

Launch the application via:
```
yarn start
```
Open menu `View -> Toggle Developer Tools`

#### Debug main process

Launch the application via 
```
yarn inspect
```
Open URI `chrome://inspect` in Chromium

Then add a network target `localhost:5858` via button "Configure" and select this target below.

#### Build and run in production mode

Replace the following line in file `./AdGuard/Config.xcconfig`
```
AG_SIGN = <YOUR APPLE DEVELOPER COMMON NAME>
```
where `<YOUR APPLE DEVELOPER COMMON NAME>` is your codesign identity

Make sure your system Nodejs version higher v8.9.4.

Steps to check it:
if you use `nvm` run 
```
nvm use system
node -v
```
otherwise 
```
node -v
```

Open `AdGuard.xcworkspace` in Xcode and run building project

#### How to run tests
```
cd ElectronMainApp
yarn test
```

#### How to update translations

Before updating translations you need to install dependencies.

To do this, you can build project in xCode or run the following commands:
```
cd ElectronMainApp
yarn install
```

Create directory `private` in the root of the project and put file `oneskyapp.json` in it. 

Example of `oneskyapp.json`
```
{
    "url": "https://platform.api.onesky.io/1/projects/",
    "projectId": <PROJECT ID>,
    "apiKey": <API KEY>,
    "secretKey": <SECRET KEY>
}
```

#### Exporting translations
```
sh SupportingScripts/localizations/export.sh .
```

#### Importing translations
```
sh SupportingScripts/localizations/import.sh .
```

Change `.` to path to your project if you not in the root.

## How to release standalone builds
- update version `package.json` and `AdGuard/standalone.xcconfig` or `AdGuard/standalone-beta.xcconfig`
- select xcode build configuration (Standalone-beta or Standalone)
- build apps
- notarize builds
- publish release on Github
- refresh `updates/updates.json` and `release.json` in gh-pages branch

### Notarization commands
#### Notarize request
```
xcrun altool --notarize-app --primary-bundle-id "com.adguard.safari.AdGuard" --username <ICLOUD_USERNAME> --password "@keychain:altool_access" --asc-provider <TEAM_ID> --file AdGuard\ for\ Safari.app.zip
```
#### Get notarization result
```
xcrun altool --notarization-info <REQUEST_ID -u <ICLOUD_USERNAME> --password "@keychain:altool_access"
```
#### Staple
```
xcrun stapler staple AdGuard\ for\ Safari.app.zip
```

#### Common issues
https://developer.apple.com/documentation/security/notarizing_your_app_before_distribution/resolving_common_notarization_issues

Use fixed `electron-osx-sign`
```
npm install -g electron-userland/electron-osx-sign#timestamp-server
```
