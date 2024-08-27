# AdGuard for Safari Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- version of the app is in ElectronMainApp/package.json -->

## [1.11.19] - 2024-08-22

### Changed

- Updated [@adguard/scriptlets] to v1.11.16

[1.11.19]: https://github.com/AdguardTeam/AdGuardForSafari/compare/v1.11.18.332-release...v1.11.19.336-release

## [1.11.18] - 2024-05-20

### Changed

- Updated [@adguard/scriptlets] to v1.10.25

[1.11.18]: https://github.com/AdguardTeam/AdGuardForSafari/compare/v1.11.17.329-release...v1.11.18.332-release


## [1.11.17] - 2024-03-05

### Changed

- Updated [@adguard/scriptlets] to v1.10.1

[1.11.17]: https://github.com/AdguardTeam/AdGuardForSafari/compare/v1.11.16.328-release...v1.11.17.329-release


## [1.11.16] - 2023-11-21

### Changed

- Advanced rules applying script injected as a blob [#917]
- Updated [@adguard/filters-downloader] to v1.1.23
- Updated [@adguard/scriptlets] to v1.9.91

[1.11.16]: https://github.com/AdguardTeam/AdGuardForSafari/compare/v1.11.15.309-release...v1.11.16.324-release
[#917]: https://github.com/AdguardTeam/AdGuardForSafari/issues/917


## [1.11.15] - 2023-10-06

### Changed

- Updated [@adguard/scriptlets] to v1.9.72
- Updated [SafariConverterLib] to v2.0.43

### Fixed

- Settings panel opens at login [#853]
- `$match-case` modifier does not work [SafariConverterLib#55]
- Improve handling of AdGuard Advanced Blocking extension in Safari 17 toolbar [#877]

[1.11.15]: https://github.com/AdguardTeam/AdGuardForSafari/compare/v1.11.14.301-release...v1.11.15.309-release
[#853]: https://github.com/AdguardTeam/AdGuardForSafari/issues/853
[SafariConverterLib#55]: https://github.com/AdguardTeam/SafariConverterLib/issues/55
[#877]: https://github.com/AdguardTeam/AdGuardForSafari/issues/877


## [1.11.14] - 2023-07-24

### Changed

- Updated AdGuard Assistant to v4.3.70
- Updated [SafariConverterLib] to v2.0.40
- Updated [@adguard/scriptlets] to v1.9.37

### Fixed

- Rules with a large number of domains in `unless-domain` and `if-domain` are split [SafariConverterLib#51]
- Rules containing `if-domain` and `unless-domain` with regex values are not supported [SafariConverterLib#53]

[1.11.14]: https://github.com/AdguardTeam/AdGuardForSafari/compare/v1.11.13.297-release...v1.11.14.301-release
[SafariConverterLib#51]: https://github.com/AdguardTeam/SafariConverterLib/issues/51
[SafariConverterLib#53]: https://github.com/AdguardTeam/SafariConverterLib/issues/53


## [1.11.13] - 2023-05-15

### Changed

- Updated [SafariConverterLib] to v2.0.39 — support :has() pseudo-class by Safari content blockers [since Safari v16.4]
- Updated [@adguard/scriptlets] to v1.9.7
- Updated ExtendedCss to v2.0.52

[1.11.13]: https://github.com/AdguardTeam/AdGuardForSafari/compare/v1.11.12.289-release...v1.11.13.297-release
[since Safari v16.4]: https://www.webkit.org/blog/13966/webkit-features-in-safari-16-4/


[@adguard/filters-downloader]: https://github.com/AdguardTeam/FiltersDownloader/blob/master/CHANGELOG.md
[@adguard/scriptlets]: https://github.com/AdguardTeam/Scriptlets/blob/master/CHANGELOG.md
[SafariConverterLib]: https://github.com/AdguardTeam/SafariConverterLib/blob/master/CHANGELOG.md
