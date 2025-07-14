import fse from 'fs-extra';
import path from 'path';

export default class BuildUtils {
  static buildDetailsMessage({ version, release, target, manifestVersion, config }) {
    return `👷 Build Details 🏗️

🔖 version: ${version}
🚀 release: ${release ? '✔️' : '✖️'}
🎯 target: ${target}
📝 manifestVersion: ${manifestVersion}
⚙️ config: ${JSON.stringify(config, null, 2)}
`;
  }

  // Paths are relative from the project root
  // Should be correct when running with `npm run ...`
  static get buildFilePath() {
    return path.join('.build.json');
  }

  // Class Methods
  static buildFilePathByEnv(env = 'dev') {
    if (env == 'dev') return this.devBuildFilePath;
    if (env == 'release') return this.releaseBuildFilePath;
    if (env == 'test') return this.testBuildFilePath;
    return '';
  }

  static get devBuildFilePath() {
    return path.join('.build.dev.json');
  }

  static get distManifestPath() {
    return path.join('dist', 'manifest.json');
  }

  static get environments() {
    return ['dev', 'release', 'test'];
  }

  static loadJSONFile(file) {
    return JSON.parse(fse.readFileSync(file));
  }

  static parseArgv(argv) {
    return {
      process: argv[0],
      script: argv[1],
      arguments: Object.fromEntries(
        argv.slice(2).map((arg) => {
          const [key, val] = arg.replace(/^--/, '').split('=');
          let value = val ?? true;
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          else if (typeof value === 'string' && !isNaN(value)) value = Number(value);
          return [key, value];
        })
      ),
    };
  }

  static get releaseBuildFilePath() {
    return path.join('.build.release.json');
  }

  static get srcManifestPath() {
    return path.join('src', 'static', 'manifest.json');
  }

  static get targets() {
    return ['bookmarklet', 'chrome', 'firefox', 'edgeLegacy'];
  }

  static get testBuildFilePath() {
    return path.join('.build.test.json');
  }

  static writeJSONFile(file, object) {
    const content = JSON.stringify(object, null, 2);
    fse.writeFileSync(file, content);
  }

  constructor() {
    throw new Error('Please call class methods directly.');
  }
}
