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

### remove_certs

```sh
[bundle exec] fastlane remove_certs
```

Remove local keychain, which contains certificates

### notari

```sh
[bundle exec] fastlane notari
```

Notarize bundle using default credentials

Required options:

  - bundle: STRING Path to bundle, must be defined relativelly to BUILD_DIR

  - id: STRING Bundle id, used for notary service

### upload_to_mas

```sh
[bundle exec] fastlane upload_to_mas
```

Submit app to MAS from Xcode archive (xcarchive)

Required options:

  - archive: STRING Path to Xcode archive

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
