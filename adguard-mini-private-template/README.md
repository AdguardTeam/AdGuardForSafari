# AdGuard Mini Private

Directory containing private configuration settings. Here you can find the templates you need.

## Structure

Folder `adguard-mini-private` contains:

- `credentials` folder:
  - `app-store-api-info.json`. See [Using fastlane API Key JSON file](https://docs.fastlane.tools/app-store-connect-api/)
  - `env-vars.json`. See `fastlane action match` and [.env.default](/fastlane/.env.default)
- `configuration` folder:
  - `Config.xcconfig`. This file contains customizable constants such as Team ID, Application ID, and app group.

## Development

1. You need to copy the template folder to the same level as the main repository so that the structure is as follows:

```
- Base folder:
  - adguard-mini
  - adguard-mini-private
```

2. Remove the ".template" from all files and fill the templates with your data.
