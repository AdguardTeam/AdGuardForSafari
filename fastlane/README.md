fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

### certs

```sh
[bundle exec] fastlane certs
```

Installs or updates certificates and provisioning profiles, which need for build product

### build

```sh
[bundle exec] fastlane build
```

Build App and archive

Options:

  - config (required): STRING Configuration for build. Can be one of ["Release", "Beta", "Nightly", "MAS", "MAS(IAP)", "Debug", "TempDev"]

  - notarize (optional): BOOL Notarize bundle. Default is true

  - obtain_version (optional): BOOL Create version.txt with version and build number inside 'build' folder. Default false

### notari

```sh
[bundle exec] fastlane notari
```

Notarize bundle using default credentials

Required options:

  - config (required): STRING Configuration for build. Can be one of ["Release", "Beta", "Nightly", "MAS", "MAS(IAP)", "Debug", "TempDev"]

  - bundle: STRING Path to bundle, must be defined relatively to BUILD_PATH

  - id: STRING Bundle id, used for notary service

### increment_version

```sh
[bundle exec] fastlane increment_version
```

Inrement some version

Required option:

  - type: STRING Part of the version that will be increased. Available: 'major', 'minor', 'patch', 'build'

Increasing the senior version leads to zeroing out the junior versions, except for the build number.

### test

```sh
[bundle exec] fastlane test
```

Run AdguardMiniTests tests

### upload_to_mas

```sh
[bundle exec] fastlane upload_to_mas
```

Submit app to MAS from Xcode archive (xcarchive)

Required options:

  - archive: STRING Path to Xcode archive

### update_third_party_deps

```sh
[bundle exec] fastlane update_third_party_deps
```

Update third party dependencies

Options:
- packages (optional): Comma-separated list of specific packages to update
- dry_run (optional): Run in dry-run mode to check for updates without applying them

Available packages:
- npm: assistant, safari-extension
- SPM: safariconverterlib

Note: Other SPM packages are updated manually, AdGuard Extra is downloaded during build

Examples:
fastlane update_third_party_deps
fastlane update_third_party_deps packages:assistant
fastlane update_third_party_deps packages:safariconverterlib
fastlane update_third_party_deps dry_run:true

### generate_appcast

```sh
[bundle exec] fastlane generate_appcast
```

Create appcast for standalone builds

Options:

  - output (required): PATH Path to new appcast file. MUST BE ONLY NEW

  - updates (required): PATH Path to folder with new app version

  - sparkle (required): PATH Path to sparkle generate_appcast binary

  - release_notes_url (required): URL Release notes url for this build

  - channel (optional): STRING Channel for generate appcast. Must be one of [release, beta, nightly, dev]. Default is "release" (aka Sparkle "default") channel

  - download_url_prefix (optional): URL Prefix of AdGuard Mini package. Default is "ADGUARD_UPDATE_BASE_URL/channel"

### to_sentry

```sh
[bundle exec] fastlane to_sentry
```

Uploading of a build symbols to Sentry server

Options:

  - auth_token (required): STRING Token for upload Sentry debug symbols

  - config (required): STRING Configuration for build. Can be one of ["Release", "Beta", "Nightly", "MAS", "MAS(IAP)", "Debug", "TempDev"]

### build_sciter_ui

```sh
[bundle exec] fastlane build_sciter_ui
```

Create sciter resources and UI

Options:

  - config: STRING If config is set to Debug, sciter resources will be built in `dev` configuration, otherwise `prod`. The default value is empty.

### update_proto_schema

```sh
[bundle exec] fastlane update_proto_schema
```

Update proto schema

### create_sens_config

```sh
[bundle exec] fastlane create_sens_config
```

Create sensitive config

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
