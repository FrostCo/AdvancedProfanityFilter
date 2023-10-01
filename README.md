# Advanced Profanity Filter
[<img src="https://flat.badgen.net/chrome-web-store/users/piajkpdbaniagacofgklljacgjhefjeh?color=blue" alt="Chrome Web Store" width="71" height="20">](https://chrome.google.com/webstore/detail/advanced-profanity-filter/piajkpdbaniagacofgklljacgjhefjeh)
[<img src="https://flat.badgen.net/chrome-web-store/stars/piajkpdbaniagacofgklljacgjhefjeh?color=blue" width="102" height="20">](https://chrome.google.com/webstore/detail/advanced-profanity-filter/piajkpdbaniagacofgklljacgjhefjeh)
[<img src="https://flat.badgen.net/badge/icon/discord?icon=discord&label" alt="Discord" width="68" height="20">](https://discord.com/invite/MpE5Z3f)
[<img src="https://flat.badgen.net/badge/paypal/donate/FFC439" alt="PayPal" width="95" height="20">](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=XFL36QJY752R6&source=url)
[<img src="https://flat.badgen.net/badge/icon/patreon/F96854?icon=patreon&label" alt="Patreon" width="71" height="20">](https://www.patreon.com/richardfrost)

[<img src="https://badgen.net/badge/icon/github?icon=github&label" alt="GitHub" width="63" height="20">](https://github.com/FrostCo/AdvancedProfanityFilter)
[<img src="https://badgen.net/badge/git/codeberg?icon=git&label" alt="Codeberg" width="79" height="20">](https://codeberg.org/FrostCo/AdvancedProfanityFilter)

A browser extension to filter profanity from webpages.

For an overview of features and options, please head to the [wiki](https://github.com/FrostCo/AdvancedProfanityFilter/wiki).

## Installation
| Browser | Download |
|---------|----------|
| Chrome  | [Chrome Web Store](https://chrome.google.com/webstore/detail/advanced-profanity-filter/piajkpdbaniagacofgklljacgjhefjeh) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/advanced_profanity_filter) |
| Edge    | [Microsoft Edge Addons](https://microsoftedge.microsoft.com/addons/detail/lhnbdlbhcokmgpjenkjolnhdnkphnkam) |
| Safari  | [App Store](https://apps.apple.com/app/advanced-profanity-filter/id1593810102) |
| Opera   | [Opera addons](https://addons.opera.com/en/extensions/details/advanced-profanity-filter/) |
| Android | [Kiwi](https://play.google.com/store/apps/details?id=com.kiwibrowser.browser) or [Firefox](https://github.com/FrostCo/AdvancedProfanityFilter/issues/243#issuecomment-726218625) |
| Other   | [Bookmarklet Info](https://github.com/FrostCo/AdvancedProfanityFilter/wiki/Bookmarklet) |
| TV Cast | [Instructions](https://github.com/FrostCo/AdvancedProfanityFilter/wiki/Audio#watch-on-tv) - [Discussion](https://github.com/FrostCo/AdvancedProfanityFilter/issues/206) |

## Features
* Filter modes
    * Censor - Hide offending words
    * Substitute - Replace offensive words
    * Remove - Remove offensive words
* Customizable word and substitution lists
* Works everywhere, including popular pages such as:
    * Facebook
    * Pinterest
    * Reddit
    * Twitter
* [Audio muting](https://github.com/FrostCo/AdvancedProfanityFilter/wiki/Audio) for videos on supported sites:
    * Amazon Video
    * Hulu
    * Netflix
    * Plex
    * Vudu
    * YouTube
    * And more! see [all supported sites here](https://apf.frostco.dev/status)
    * You can even add your own! ([advanced](https://github.com/FrostCo/AdvancedProfanityFilter/wiki/Custom-Audio-Muting-Site))

For a detailed overview of the features and settings, please see the [Getting Started page](https://github.com/FrostCo/AdvancedProfanityFilter/wiki).

## Issues, Suggestions or Feedback?
* Found a bug? Please open an [issue](https://github.com/FrostCo/AdvancedProfanityFilter/issues/new).
* Have a great idea to improve the project? Want to share some feedback? Head over [here](https://goo.gl/forms/LTqFpJ0mCTsrgGgf2).

## Beta Testing
If you would like to help with development, but don't have experience coding, its very helpful to have users test a release candidate before actually publishing it to everyone. If you are interested in testing new versions see [this page](https://github.com/FrostCo/AdvancedProfanityFilter/wiki/Beta-Testing) for more information.

## Development
### Quick Start
After downloading/cloning the repository, run the following commands to get started:

```sh
# Install dependencies
npm install

# Build the extension for the default target browser for local development
# See table below for supported targets
npm run build
```
Once the extension has been built, you can load the unpacked extension (found in `dist/`) in your browser.

### Stages
| Stage   | Output                                | Description                                       |
|---------|---------------------------------------|---------------------------------------------------|
| build   | `dist/`                               | Build/compile the extension for local development |
| package | `release/target-manifest-version.zip` | Package the files for the target browser          |
| release | `release/target-manifest-version.zip` | Create an official release for a target browser   |

### Targets
| Target     | Manifest | Browsers           |
|------------|---------:|--------------------|
| chrome     |    2, 3* | Chrome, Edge, etc. |
| edgeLegacy |        2 | Legacy Edge        |
| firefox    |     2, 3 | Firefox            |


_* = default target_

### Scripts
For all scripts, please see `package.json`.

#### Commonly used scripts
| Target  | Manifest | Stage   | Script                      | Description                       |
|---------|---------:|---------|-----------------------------|-----------------------------------|
| chrome  |        3 | build   | `npm run build:chrome:mv3`  | Dev build for Chrome Manifest V3  |
| chrome  |        2 | build   | `npm run build:chrome:mv2`  | Dev build for Chrome Manifest V2  |
| firefox |        2 | build   | `npm run build:firefox:mv2` | Dev build for Firefox Manifest V2 |
|         |          | release | `npm run release:all`       | Official relase for all targets   |

### State files
The state files hold the details about the current build. These files are managed by `bin/prebuild.mjs`.
- `.build.json`
  - Active build state file that is referenced when building/packaging/releasing
  - Gets replaced by the dev or release build files outlined below
- `.build.dev.json`
  - Holds the development build details and allows the developer to omit the target from commands such as `npm run build` to rebuild the project for the target specified in the file
  - Overwrites `.build.json` when `--release` is **not** passed to `bin/prebuild.mjs`
- `.build.release.json`
  - Holds the release build details
  - Overwrites `.build.json` when `--release` **is** passed to `bin/prebuild.mjs`

#### Details contained in state files:
- `config`: Overrides for the target
- `manifestVersion`: Manifest version from `src/static/manifest.json`
- `target`: Target browser
- `version`: Build version from `package.json`
