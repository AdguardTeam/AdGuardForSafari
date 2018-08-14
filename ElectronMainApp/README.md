# AdGuard Safari Application Extension

### How to build
```
  yarn build
```

#### Requirements

- [nodejs](https://nodejs.org/en/download/)
- [yarn](https://yarnpkg.com/en/docs/install/)

npm install electron-packager -g
 npm install node-gyp -g 

Install local dependencies by runnning:
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
