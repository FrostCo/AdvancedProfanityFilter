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

Once the extension has been built, you can load the unpacked extension (found in `dist/`) in your browser.

### Commonly Used Scripts
| Target  | Manifest | Stage   | Script                      | Description                       |
|---------|---------:|---------|-----------------------------|-----------------------------------|
| chrome  |        3 | build   | `npm run build:chrome:mv3`  | Dev build for Chrome Manifest V3  |
| chrome  |        2 | build   | `npm run build:chrome:mv2`  | Dev build for Chrome Manifest V2  |
| firefox |        2 | build   | `npm run build:firefox:mv2` | Dev build for Firefox Manifest V2 |
|         |          | release | `npm run release:all`       | Official relase for all targets   |

## Build Targets
| Target     | Manifest | Browsers           |
|------------|---------:|--------------------|
| chrome     |    2, 3* | Chrome, Edge, etc. |
| edgeLegacy |        2 | Legacy Edge        |
| firefox    |     2, 3 | Firefox            |

_* = default target_

## Build Stages
| Stage   | Output                                | Description                                       |
|---------|---------------------------------------|---------------------------------------------------|
| build   | `dist/`                               | Build/compile the extension for local development |
| release | `release/target-manifest-version.zip` | Create an official release for a target browser   |

## State Files
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
  - npm run prebuild
    - npm run clean:build
      - node bin/clean.mjs --build
    - node bin/prebuild.mjs --$npm_config_target
      - NOTE: $npm_config_target will be blank (`--`)
  - webpack --config bin/webpack.dev.js
  - npm run build:static
    - node bin/copy-static.mjs
  - npm run postbuild
    - node bin/postbuild.mjs

### Build Chrome Manifest V2
- `npm run build:chrome:mv2`
  - npm run build --target=chrome-mv2
    - npm run prebuild
      - npm run clean:build
        - node bin/clean.mjs --build
      - node bin/prebuild.mjs --$npm_config_target
    - npm run build
      - webpack --config bin/webpack.dev.js
      - npm run build:static
        - node bin/copy-static.mjs
      - npm run postbuild
        - node bin/postbuild.mjs

### Release Chrome Manifest V3
- `npm run release:chrome:mv3`
  - npm run release:build --target=chrome-mv3
    - npm run prerelease:build
      - npm run clean:build
        - node bin/clean.mjs --build
      - node bin/prebuild.mjs --release --$npm_config_target
    - webpack --config bin/webpack.prod.js
    - npm run build:static
      - node bin/copy-static.mjs
    - postrelease:build
      - node bin/postbuild.mjs
  - npm run package
    - node bin/package-extension.mjs

### Test Addon (Firefox Manifest V2)
- `npm run test:addon`
  - npm run release:build --target=firefox-mv2
    - npm run prerelease:build
      - npm run clean:build
        - node bin/clean.mjs --build
      - node bin/prebuild.mjs --release --$npm_config_target
    - webpack --config bin/webpack.prod.js
    - npm run build:static
      - node bin/copy-static.mjs
    - postrelease:build
      - node bin/postbuild.mjs
  - npx addons-linter ./dist
