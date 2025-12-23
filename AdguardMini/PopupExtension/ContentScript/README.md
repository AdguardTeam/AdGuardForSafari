# Content Script

## Project structure

- `/src` - Source files.

Generally, the only part of the App Extension is its content script.

The content script will be built and copied to the application resources each build process.

## How does it work

The extension implements a simple algorithm to lookup and apply "advanced"
content blocking rules to web pages.

> We call the rules "advanced" because there is no similar alternative provided
> by Safari Content Blocking API and the only way to apply them is to interpret
> these rules with a JS script.

The algorithm consists of the following stages:

- Content script requests the native host for the rules to apply to the current
  page.
- Native extension host prepares a set of rules for the page and passes them
  back to the content script.
- Content script uses `ContentScript` object provided by
  [SafariConverterLib][safariconverterlib] to apply the rules.

## How to build

1. `yarn install` - Install dependencies.
2. `yarn build` - Build the project and copy the generated script to the
    extension resources folder.
3. `yarn lint` - Run ESLint to check the code for errors and style violations.
