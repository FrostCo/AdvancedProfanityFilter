# Advanced Profanity Filter
[![Build Status](https://img.shields.io/travis/com/richardfrost/AdvancedProfanityFilter/master.svg?style=flat-square)](https://travis-ci.com/richardfrost/AdvancedProfanityFilter)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/d/piajkpdbaniagacofgklljacgjhefjeh.svg?style=flat-square)](https://chrome.google.com/webstore/detail/advanced-profanity-filter/piajkpdbaniagacofgklljacgjhefjeh)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/stars/piajkpdbaniagacofgklljacgjhefjeh.svg?style=flat-square)](https://chrome.google.com/webstore/detail/advanced-profanity-filter/piajkpdbaniagacofgklljacgjhefjeh)
[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=XFL36QJY752R6&source=url)

A browser extension to filter profanity from webpages.

For an overview of features and options, please head to the [wiki](https://github.com/richardfrost/AdvancedProfanityFilter/wiki).

### Installation
| Browser | Download |
|---------|----------|
| Chrome  | [Chrome Web Store](https://chrome.google.com/webstore/detail/advanced-profanity-filter/piajkpdbaniagacofgklljacgjhefjeh) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/advanced_profanity_filter)|
| Opera   | [Opera addons](https://addons.opera.com/en/extensions/details/advanced-profanity-filter/)
| Edge    | [More Info](https://github.com/richardfrost/AdvancedProfanityFilter/issues/102) |

### Features
* Multiple Filter Types
    * Censor - Hide offending words
    * Substitute - Replace offensive words
    * Remove - Remove offensive words
* Customizable word and substitution list
* Optional Advanced Mode for troublesome pages
* Disable filter for specific domains
* Import/Export settings to share with others
* Sync settings across browsers
* Context menu for easily adding words and disabling the filter
* Counter showing number of filtered words
* Basic password protection for options page
* Supports popular sites such as:
    * Facebook
    * Pinterest
    * Reddit
    * Twitter
    * YouTube
* Experimental audio muting for videos on supported sites:
    * Amazon Video
    * Netflix
    * Plex
    * Vudu
    * YouTube

### Issues, Suggestions or Feedback?
* Found a bug? Please open an [issue](https://github.com/richardfrost/AdvancedProfanityFilter/issues/new).
* Have a great idea to improve the project? Want to share some feedback? Head over [here](https://goo.gl/forms/LTqFpJ0mCTsrgGgf2).

### Beta Testing
If you would like to help with development, but don't have experience coding, its very helpful to have users test a release candidate before actually publishing it to everyone. If you are interested in testing new versions see [this page](https://github.com/richardfrost/AdvancedProfanityFilter/wiki/Beta-Testing) for more information.

### Development
This project is written in TypeScript, and during the build/package process it will be converted to JS. Please see `package.json`'s scripts for more info on the process.

Getting started
```
npm install
```

To Build the extension
```
npm run package
```