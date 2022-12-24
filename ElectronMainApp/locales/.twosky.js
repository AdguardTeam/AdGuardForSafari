// This file added here automatically, see Scripts/build-electron-app.sh
module.exports = [
  {
    "project_id": "safari",
    "base_locale": "en",
    "languages": {
      "ar": "Arabic",
      "be": "Belarusian",
      "en": "English",
      "cs": "Czech",
      "da": "Danish",
      "de": "German",
      "el": "Greek",
      "es": "Spanish",
      "fa": "Persian",
      "fi": "Finnish",
      "fr": "French",
      "he": "Hebrew",
      "hr": "Croatian",
      "hu": "Hungarian",
      "id": "Indonesian",
      "it": "Italian",
      "ja": "Japanese",
      "ko": "Korean",
      "nl": "Dutch",
      "nb": "Norwegian Bokmal",
      "pl": "Polish",
      "pt-BR": "Portuguese (Brazil)",
      "pt-PT": "Portuguese",
      "ro": "Romanian",
      "ru": "Russian",
      "sk": "Slovak",
      "sl": "Slovenian",
      "sr-Latn": "Serbian",
      "sv": "Sweden",
      "th": "Thai",
      "tr": "Turkish",
      "uk": "Ukrainian",
      "uz": "Uzbek",
      "vi": "Vietnamese",
      "zh-Hans": "Chinese Simplified (mainland China)",
      "zh-Hant": "Chinese Traditional (Taiwan)"
    },
    "localizable_files": [
      "Extension/Localizable.strings",
      "Extension/InfoPlist.strings",
      "AdvancedBlocking/InfoPlist.strings",
      "BlockerCustomExtension/InfoPlist.strings",
      "BlockerExtension/InfoPlist.strings",
      "BlockerOtherExtension/InfoPlist.strings",
      "BlockerPrivacyExtension/InfoPlist.strings",
      "BlockerSecurityExtension/InfoPlist.strings",
      "BlockerSocialExtension/InfoPlist.strings"
    ],
    "json_files": [
      "../ElectronMainApp/locales"
    ],
    "xib_files": [
      "Extension/Base.lproj/SafariExtensionViewController.xib"
    ],
    "json_pairs": {
      "zh-Hans" : "zh-cn",
      "zh-Hant" : "zh-tw"
    }
  }
];
