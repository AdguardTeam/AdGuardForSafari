# AdGuard for Mac - Support scripts

This project is supposed to automate some standard tasks.

- [Requirements](#requirements)
- [Localization](#localization)
  - [How to make git diff work with .strings files](#git-diff)
  - [Exporting base strings](#export)
  - [Importing translations](#import)
  - [Updating .strings files from XIB files](#strings-from-xib)
  - [Updating XIB files (from .strings files)](#xib-from-strings)
  - [Exporting translations](#export-all)
- [Notarization](#notarization)

## <a id="requirements"></a> Requirements

- `python3`
- `XCode command line tools`

In order to supply developer-specific arguments, you need to create your own `.devconfig.json` file.
Please take a look at `.devconfig.json.template` to find out what exactly should be there.

## <a id="localization"></a> Localization

Localization process consists of multiple phases. Please read what's done on each step.

> **IMPORTANT:** For localization to work you must keep track of all localizable files in the `.twosky.json` file.
> Whenever you need to add a new localizable file, don't forget to add it there.

Also, you will need to keep the list of languages up-to-date in the `.twosky.json` file in the repository root.

### <a id="git-diff"></a> How to make git diff work with .strings files

Add this to your `~/.gitconfig` file:

```
[diff "localizablestrings"]
textconv = "iconv -f utf-16 -t utf-8"
```

### <a id="export"></a> Exporting base strings

Uploads strings in the base language to the translation system.

```
python3 localization.py --export
```

### <a id="import"></a> Importing translations

Downloads all translated files from the translation system.

```
python3 localization.py --import
```

You can import just a single translation if you pass the locale as well.

For instance:

```
python3 localization.py --import=en
```

### <a id="strings-from-xib"></a> Updating .strings files from XIB files

This script uses `.xib` files and updates `.strings` files of the base language project.
This might be necessary in the development process.

```
python3 localization.py --update-strings
```

### <a id="xib-from-strings"></a> Updating XIB files (from .strings files)

This script uses `.strings` files from the base language project to update the XIB files.
This operation should be performed every time you import & merge translations.

```
python3 localization.py --update-xib
```

### <a id="export-all"></a> Exporting translations

Upload ALL translations to the translation system including the base language.
Please note, that all the existing translations in the translation system **will be overwritten**.

> **IMPORTANT: DO NOT USE IT UNLESS YOU REALLY NEED THIS.**
> For instance, you could need it for migration purposes.

```
python3 localization.py --export-all
```

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
