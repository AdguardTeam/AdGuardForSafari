# AdGuard for Mac - Support scripts

This project is supposed to automate some standard tasks.

- [Requirements](#requirements)
- [Notarization](#notarization)

## <a id="requirements"></a> Requirements

- `python3`
- `XCode command line tools`

In order to supply developer-specific arguments, you need to create your own `.devconfig.json` file.
Please take a look at `.devconfig.json.template` to find out what exactly should be there.

## <a id="notarization"></a> Notarization

[Notarization](https://developer.apple.com/documentation/security/notarizing_your_app_before_distribution) is a necessary step for the app distribution. It means that the app needs to be uploaded to the Apple's notary service, and then "stapled" once it's done.

We made a special script that automates the whole process:

```
Usage: notarize.py [options]

Options:
  -h, --help            show this help message and exit
  -p PATH, --path=PATH  path to the file or app to notarize.
  -b BUNDLE_ID, --bundle-id=BUNDLE_ID
                        bundle ID for the notary service.
```
