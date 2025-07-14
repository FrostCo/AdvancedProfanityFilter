# Development

## Quick Start

After downloading/cloning the repository, run the following commands to get started:

```sh
# Install dependencies
npm install

# Build the extension for the default target browser for local development
# See table below for supported targets
npm run build
```

```sh
# Configure git blame ignore revs file to ignore recommended commits
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

Once the extension has been built, you can load the unpacked extension (found in `dist/`) in your browser.

### Commonly Used Scripts

| Target  | Manifest | Stage   | Script                      | Description                       |
| ------- | -------: | ------- | --------------------------- | --------------------------------- |
| chrome  |        3 | build   | `npm run build:chrome:mv3`  | Dev build for Chrome Manifest V3  |
| chrome  |        2 | build   | `npm run build:chrome:mv2`  | Dev build for Chrome Manifest V2  |
| firefox |        2 | build   | `npm run build:firefox:mv2` | Dev build for Firefox Manifest V2 |
|         |          | release | `npm run release:all`       | Official relase for all targets   |

## Build Targets

| Target     | Manifest | Browsers           |
| ---------- | -------: | ------------------ |
| chrome     |   2, 3\* | Chrome, Edge, etc. |
| edgeLegacy |        2 | Legacy Edge        |
| firefox    |   2\*, 3 | Firefox            |

\* = _default target_

## Build Stages

| Stage   | Output                                | Description                                       |
| ------- | ------------------------------------- | ------------------------------------------------- |
| build   | `dist/`                               | Build/compile the extension for local development |
| release | `release/target-manifest-version.zip` | Create an official release for a target browser   |

## State Files

The state files hold the details about the current build. These files are managed by `bin/prebuild.js`.

- `.build.json`
  - Active build state file that is referenced when building/packaging/releasing
  - Gets replaced by the dev or release build files outlined below
- `.build.dev.json`
  - Holds the development build details and allows the developer to omit the target from commands such as `npm run build` to rebuild the project for the target specified in the file
  - Overwrites `.build.json` when `--release` is **not** passed to `bin/prebuild.js`
- `.build.release.json`
  - Holds the release build details
  - Overwrites `.build.json` when `--release` **is** passed to `bin/prebuild.js`

### Details Contained In State Files

- `config`: Overrides for the target
- `manifestVersion`: Manifest version from `src/static/manifest.json`
- `target`: Target browser
- `version`: Build version from `package.json`

## Scripts

For all scripts, please see `package.json`.

## Build Chains

### Build (Load Last Target From File)

- `npm run build`
  - node bin/cli/prebuild.js
  - webpack --config bin/webpack.dev.js
    - TranslationBuilderPlugin (builds translations)
    - CopyPlugin (copies static files and images)
    - PostbuildPlugin (runs postbuild tasks)

### Build Chrome Manifest V2

- `npm run build:chrome:mv2`
  - node bin/cli/prebuild.js --target=chrome-mv2
  - webpack --config bin/webpack.dev.js
    - TranslationBuilderPlugin (builds translations)
    - CopyPlugin (copies static files and images)
    - PostbuildPlugin (runs postbuild tasks)

### Release Chrome Manifest V3

- `npm run release:chrome:mv3`
  - node bin/cli/prebuild.js --environment=release --target=chrome-mv3
  - webpack --config bin/webpack.prod.js
    - TranslationBuilderPlugin (builds translations)
    - CopyPlugin (copies static files and images)
    - PostbuildPlugin (runs postbuild tasks)
    - PackExtensionPlugin (creates release zip)

### Test Addon (Firefox Manifest V2)

- `npm run test:addon`
  - node bin/cli/prebuild.js --environment=test --target=firefox-mv2
  - webpack --config bin/webpack.prod.js
    - TranslationBuilderPlugin (builds translations)
    - CopyPlugin (copies static files and images)
    - PostbuildPlugin (runs postbuild tasks)
  - npx addons-linter ./dist

## Localization

Adding support for a new language can be done by creating a new locale folder (`locales/{lang}`) with a file for each namespace. To update an existing translation, modify the existing file in the same location.

Translations will automatically be compiled at build time by the `TranslationBuilderPlugin` webpack plugin, but can be run manually as well with `node bin/cli/build-translations.js`. The compiled translations are stored in `src/script/translations.js`.

To use the translations, use the `Translation` class (`src/script/translation.ts`). When creating a new instance, pass in the desired namespace(s) (you should almost always include the `'common'` namespace). Once you have the translation instance you can simply call `translation.t()` with the desired key, such as `common:app.name`.

### Namespaces

- **Background**: Tranlations for context menu entries and the update notification
- **Common**: Common translations shared across the app
- **Options**: Translations for the extension's Option page
- **Popup**: Translations for the extension's Popup page
