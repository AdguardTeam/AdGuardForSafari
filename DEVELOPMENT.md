# Development instructions

## Requirements

Minimum deployment target: macOS 12.

### Main Development

- Xcode 15 or later
- Ruby 3.2.2 or later
- Bundler 2.4.21 or later
- Yarn 1.22.19 or later

### Working with Proto Schema

- Python 3.9.6 or later

**Note:** `protoc` and `protoc-gen-swift` are installed automatically by `./configure.sh dev` into `build/protoc-tools/`. No manual installation required.

**Version pinning (optional):** To ensure reproducible builds, you can pin the protoc version:
```bash
echo '31.1' > .protoc-version
```

### Repository Accesses

Access via SSH:

- adguard-mac-lib
- sp-sciter-sdk
- sp-color-palette
- sp-swiftlint
- adguard-mini-private (or create it manually)

#### adguard-mini-private Structure

Information about the contents of `adguard-mini-private` is located in the `adguard-mini-private-template` folder.

### Possible Problems

#### Ruby

If your system version of Ruby is too old, install Ruby via Homebrew and add it to PATH.

Example for `zsh`:

```bash
brew install ruby
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
```

#### Tests Don't Build

If you find that your tests are not building, switch to the test target and try building locally. Add the missing source files to the appropriate target.

#### Can't See the Build in TestFlight

If the TestFlight deployment was successful but no build is displayed for a long time, it may be due to validation issues with the application package. An email describing the problem is sent to certain categories of related users, such as project managers.

The last known problems were related to invalid `sciter` `dylib` entitlements. See the `sp-sciter-sdk` repository for more information.

## Project Setup

- You must have an `adguard-mini-private` repository with credentials at the same level as the `adguard-mini` root folder
- Run `./configure.sh dev`. This command will:
  - Install local protoc tools (protoc + protoc-gen-swift) into `build/protoc-tools/`
  - Set up other development dependencies
  - Version can be pinned via `.protoc-version` file for reproducible builds
- Run `bundle exec fastlane build_sciter_ui dev_build:true`
- Build the project in Xcode

### Additional Resources

There are several scripts that improve the development process.

#### `move_templates.sh`

You can add special templates for Xcode. To do this from the `Support/Scripts` folder, execute:

```bash
./move_templates.sh
```

The templates can then be found under `macOS/AdGuardMini related` in the `New -> File` menu.

#### `flush_adguard_mini_data.sh`

Cleans all AdGuard Mini data, restoring it to the state before the first run.

### `increment-some-number.sh`

Designed to modify the constituent parts of a version or build number.

### Locales `locales.sh`

Script for pushing and pulling locales. With the `push` parameter, it pushes the master locale to TwoSky. Without arguments, it pulls all locales for Swift and Sciter.

#### Push Base Locale

```bash
./Support/Scripts/locales.sh push
```

#### Pull All Locales

```bash
./Support/Scripts/locales.sh
```

## Fastlane

Fastlane documentation can be found in the `fastlane/README.md`.

## Protobuf Schema

Generation script: `bundle exec fastlane update_proto_schema`\
Main schema `./AdguardMini/sciter-ui/schema`\
Generator configs `./AdguardMini/sciter-ui/schema/.protocfg`\
Generated Swift schema  `./AdguardMini/SciterResources/SciterSchema/Sources`\
Generated TS schema `./AdguardMini/sciter-ui/schema`

## Development

### Watch Hot-Reload Sciter Application

- In the first terminal: `yarn start`
- In the second terminal: `yarn watchProject`

## Dev and Test Tricks

### Get New Updates Immediately

To join the `Sparkle` first update group and receive version information without waiting for the phased rollout interval, run the following command before checking for updates:

```bash
# For Standalone nightly/beta/release builds
defaults write com.adguard.safari.AdGuard SUUpdateGroupIdentifier -int 2009
# For Dev builds
defaults write com.adguard.safari.AdGuard.Dev SUUpdateGroupIdentifier -int 2009
```

## ⚠️ Critical Version Synchronization Requirement

> **IMPORTANT**: SafariConverterLib and @adguard/safari-extension versions **MUST** always be exactly the same for compatibility.

The automated update process handles these packages independently:
- `SafariConverterLib` (SPM)
- `@adguard/safari-extension` (npm)

**After running `update_third_party_deps`, you MUST manually verify and synchronize versions:**

1. Check SafariConverterLib version in Xcode Project → Package Dependencies
2. Check @adguard/safari-extension version in `AdguardMini/PopupExtension/ContentScript/package.json`
3. **Manually update** the mismatched version to ensure they are identical

## Update Dependencies

Use the automated Fastlane lane:

```bash
# Update all dependencies
bundle exec fastlane update_third_party_deps

# Update specific packages
bundle exec fastlane update_third_party_deps packages:sparkle,filterlistmanager

# Check for updates without applying
bundle exec fastlane update_third_party_deps dry_run:true
```

For detailed options see `fastlane/README.md`.