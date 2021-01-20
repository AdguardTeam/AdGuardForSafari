# AdGuard Safari Application Extension

### How to build
```
  yarn build
```

#### Requirements

- [nodejs](https://nodejs.org/en/download/)
- [yarn](https://yarnpkg.com/en/docs/install/)

```
npm install electron-packager -g
npm install node-gyp -g 
npm install electron-osx-sign -g
```

Install local dependencies by running:
```
  yarn install
```

### How to run tests
```
  yarn test
```

## How to debug application during development

### Debug window

Launch application via `yarn start` and open menu `View -> Toggle Developer Tools`

### Debug main process

Launch application via `yarn inspect` and open URI `chrome://inspect` in Chrome

Then add network target `localhost:5858` via button 'Configure' and select this target below.

### Safari converter

After dependency installation ConverterTool binary will be copied to the `libs` directory to resolve its address via `app-pack` and pass to `safari-converter-lib`.
Check `content-blocker-adapter.js` for more details.
