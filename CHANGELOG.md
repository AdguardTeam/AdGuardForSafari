# AdGuard for Safari Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- version of the app is in ElectronMainApp/package.json -->


## [1.11.15]

### Changed

- Updated Scriptlets to v1.9.72
- Updated SafariConverterLib to v2.0.43

### Fixed
- Settings panel opens at login [853](https://github.com/AdguardTeam/AdGuardForSafari/issues/853)
- '$match-case' modifier does not work [#55](https://github.com/AdguardTeam/SafariConverterLib/issues/55)
- Improve handling of AdGuard Advanced Blocking extension in Safari 17 toolbar [#877](https://github.com/AdguardTeam/AdGuardForSafari/issues/877)

## [1.11.14]

### Changed

- Updated AdGuard Assistant to v4.3.70
- Updated SafariConverterLib to v2.0.40
- Updated Scriptlets to v1.9.37

### Fixed

- Rules with a large number of domains in `unless-domain` and `if-domain` are split
  [#51](https://github.com/AdguardTeam/SafariConverterLib/issues/51)
- Rules containing `if-domain` and `unless-domain` with regex values are not supported
  [#53](https://github.com/AdguardTeam/SafariConverterLib/issues/53)


## [1.11.13]

### Changed

- Updated SafariConverterLib to v2.0.39 — support :has() pseudo-class by Safari content blockers [since Safari v16.4](https://www.webkit.org/blog/13966/webkit-features-in-safari-16-4/)
- Updated Scriptlets to v1.9.7
- Updated ExtendedCss to v2.0.52


[1.11.15]: https://github.com/AdguardTeam/AdGuardForSafari/compare/v1.11.14.301-release...v1.11.15.309-release
[1.11.14]: https://github.com/AdguardTeam/AdGuardForSafari/compare/v1.11.13.297-release...v1.11.14.301-release
[1.11.13]: https://github.com/AdguardTeam/AdGuardForSafari/compare/v1.11.12.289-release...v1.11.13.297-release
