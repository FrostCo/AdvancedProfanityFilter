# @frostco/apf-core

Reusable profanity filtering engine from [Advanced Profanity Filter](https://github.com/FrostCo/AdvancedProfanityFilter). It loads an extension-style configuration and filters text in Node.js or a bundled browser application.

The package contains the filtering core only. It does not include browser-specific classes (`WebConfig`, popup, options, or background pages), Chrome extension APIs, or Premium audio muting.

## Public API

Import the package root. These are the only supported exports:

| Export              | Kind  |
| ------------------- | ----- |
| `Config`            | class |
| `Constants`         | class |
| `Filter`            | class |
| `Logger`            | class |
| `Word`              | class |
| `Wordlist`          | class |
| `ReplaceTextResult` | type  |
| `WordOptions`       | type  |

`package.json` exports only `"."`, with `dist/index.d.ts` for TypeScript and `dist/index.js` for ESM. Deep imports such as `@frostco/apf-core/dist/Filter.js` are not part of the public API. `helper.js` is included because the filtering modules import it, but its functions are not exported from the package entry. The browser extension continues to import `src/script/lib/` directly.

## Example

```js
import { Config, Constants, Filter } from '@frostco/apf-core';

const savedConfig = {
  defaultSubstitution: 'censored',
  filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
  preserveCase: true,
  words: {
    bad: {
      lists: [],
      matchMethod: Constants.MATCH_METHODS.EXACT,
      repeat: Constants.TRUE,
      separators: Constants.FALSE,
      sub: 'good',
    },
    blank: {
      lists: [],
      matchMethod: Constants.MATCH_METHODS.EXACT,
      repeat: Constants.FALSE,
      separators: Constants.FALSE,
      sub: '',
    },
  },
};

const filter = new Filter();
filter.cfg = new Config(JSON.parse(JSON.stringify(savedConfig)));
filter.init();

filter.replaceText('Bad blank statement.');
// Good censored statement.
```

An empty `sub` uses `defaultSubstitution`. `JSON.parse(JSON.stringify(...))` gives this filter its own word and allowlist arrays. See [Configuration defaults](#configuration-defaults).

## Source and build

Filtering source stays in `src/script/lib/`. From the repository root:

```sh
npm run build:libs
```

That command cleans `packages/apf-core/dist/`, compiles `src/script/lib/tsconfig.json` into that directory, adds `.js` to emitted relative imports, and copies `LICENSE`. The distributable files are the generated `dist/` output, not the TypeScript source.

## Module format

The package is ESM only (`"type": "module"`). Each compiled module has a matching `.d.ts` file. Consumers resolve the public entry through `exports`; there is no CommonJS build.

Node.js can import the package with native ESM. A browser application should import it through a bundler. The public entry does not require Chrome extension APIs.

## Build, pack, and install locally

From the repository root, build the package, then pack it from its directory:

```sh
npm run build:libs
cd packages/apf-core
npm pack
```

`npm pack` writes `frostco-apf-core-0.1.0.tgz` in `packages/apf-core/`. Install that tarball in another project:

```sh
npm install /path/to/frostco-apf-core-0.1.0.tgz
```

The tarball contains `package.json`, `README.md`, `LICENSE`, and the `dist/` JavaScript and declaration files listed in `files`.

## Version

`@frostco/apf-core` is version `0.1.0`. That version is independent of the browser extension version in the root `package.json`. Releasing the extension does not release this package.

A future package release is manual: bump `packages/apf-core/package.json`, run `npm run build:libs`, pack the tarball, and try it in a temporary consumer. This repository does not publish the package automatically.

## License

The package is [GPL-3.0-only](./LICENSE), matching `"license": "GPL-3.0-only"` in its `package.json`. The packed `LICENSE` file is a copy of the repository license.

## Configuration defaults

`new Config()` and `new Config(data)` shallow-assign `Config._defaults`. Nested default arrays, including `wordAllowlist`, are shared with that static object and with every other config that does not supply its own arrays.

For independent processing jobs, give each `Config` a separately parsed object:

```js
filter.cfg = new Config(JSON.parse(JSON.stringify(savedConfig)));
```
