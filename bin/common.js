/* eslint-disable no-console */
import fse from 'fs-extra';
import path from 'path';

export default class Common {
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
    const parsed = {};
    parsed.count = argv.length;
    parsed.process = argv[0]; // process (node)
    parsed.script = argv[1]; // script
    parsed.arguments = argv.slice(2);
    parsed.removeArgumentPrefixes = (prefix = '--') => {
      const regex = new RegExp(`^${prefix}`);
      parsed.arguments = parsed.arguments.map((arg) => arg.replace(regex, ''));
    };
    parsed.removeEmptyArguments = (blank = '') => (parsed.arguments = parsed.arguments.filter((arg) => arg !== blank));
    return parsed;
  }

  static get releaseBuildFilePath() {
    return path.join('.build.release.json');
  }

  static removeFiles(files, silent = false) {
    if (typeof files === 'string') {
      files = [files];
    }

    files.forEach((file) => {
      if (!silent) {
        console.log(`Removing ${file}`);
      }
      fse.removeSync(file);
    });
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
