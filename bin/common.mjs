import fse from 'fs-extra';
import path from 'path';

export default class Common {
  // Paths are relative from the project root
  // Should be correct when running with `npm run ...`
  static buildFilePath = path.join('.build.json');
  static devBuildFilePath = path.join('.build.dev.json');
  static distManifestPath = path.join('dist', 'manifest.json');
  static releaseBuildFilePath = path.join('.build.release.json');
  static srcManifestPath = path.join('src', 'static', 'manifest.json');
  static testBuildFilePath = path.join('.build.test.json');

  // Class Methods
  static buildFilePathByEnv(env = 'dev') {
    if (env == 'dev') return this.devBuildFilePath;
    if (env == 'release') return this.releaseBuildFilePath;
    if (env == 'test') return this.testBuildFilePath;
    return '';
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
    return parsed;
  }

  static removeFiles(files, silent = false) {
    if (typeof files === 'string') {
      files = [files];
    }

    files.forEach((file) => {
      if (!silent) {
        // eslint-disable-next-line no-console
        console.log(`Removing ${file}`);
      }
      fse.removeSync(file);
    });
  }

  static get targets() {
    return ['bookmarklet', 'chrome', 'firefox', 'edgeLegacy'];
  }

  static writeJSONFile(file, object) {
    const content = JSON.stringify(object, null, 2);
    fse.writeFileSync(file, content);
  }

  constructor() {
    throw new Error('Please call class methods directly.');
  }
}
