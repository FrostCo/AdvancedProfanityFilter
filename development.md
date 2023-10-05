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
