# AdGuard Safari Application Extension

AdGuard is a fast and lightweight ad blocking browser extension that effectively blocks all types of ads on all web pages. Unlike its standalone counterparts (AG for Windows, Mac), browser extension is completely free and open source.

AdGuard for Safari is [Electron](https://electronjs.org/) application that runs on your Mac OS. 
When app is running you can see AdGuard icon in tray.
The app adds two Safari browser extensions:
- Content Blocker
- Toolbar icon

If Toolbar icon is enabled, AdGuard icon should appear in Safari toolbar for quick access to your settings.


## Prerequisites

- MacOS 10.13 or above
- [Xcode](https://developer.apple.com/xcode/) 9.4 or above
- installed Xcode Command Line Tools
- [Node.js](https://nodejs.org/) v8.9.4 and higher
- [Yarn](https://yarnpkg.com/lang/en/)


Also you need install these packages globally

- [electron-packager](https://github.com/electron-userland/electron-packager)
- [node-gyp](https://github.com/nodejs/node-gyp)
- [electron-osx-sign](https://www.npmjs.com/package/electron-osx-sign)

```
npm install -g electron-packager 
npm install -g node-gyp 
npm install -g electron-osx-sign
```


## Installing 

### To run application in development mode 

```
cd ElectronMainApp
```

Install local dependencies by runnning:

```
yarn install
```

### How to debug application during development

#### Debug window

Launch application via 
```
yarn start
```
Open menu `View -> Toggle Developer Tools`

#### Debug main process

Launch application via 
```
yarn inspect
```
Open URI `chrome://inspect` in Chrome

Then add network target `localhost:5858` via button "Configure" and select this target below.

### Build and run in production mode

Replace following line in file `./AdGuard/Config.xcconfig`
```
AG_SIGN = <YOUR APPLE DEVELOPER COMMON NAME>
```
where `<YOUR APPLE DEVELOPER COMMON NAME>` is your codesign identity

Make sure your system Nodejs version higher v8.9.4

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


### How to run tests
```
cd ElectronMainApp
yarn test
```


### How to update localizations

Before updating localizations you need to install dependencies. 
To do this, you can build project in xCode or run the next commands
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

#### Export localizations
```
sh SupportingScripts/localizations/export.sh .
```
#### Import localizations
```
sh SupportingScripts/localizations/import.sh .
```

Change `.` to path to your project if you not in the root