import fs from 'fs-extra';
import archiver from 'archiver';
import BuildUtils from './BuildUtils.js';

// Required for Firefox due to bundled code
export default class SourcePackager {
  //#region Class reference helpers
  static get BuildUtils() {
    return BuildUtils;
  }
  get Class() {
    return this.constructor;
  }
  //#endregion

  constructor() {
    this.build = fs.readJsonSync(BuildUtils.buildFilePath);
    this.output = fs.createWriteStream(this.filePath);
    this.archive = archiver('zip', { zlib: { level: 9 } });
    this.archive.pipe(this.output);
  }

  addBinFiles() {
    this.archive.glob('bin/**/*', { ignore: this.binFilesToIgnore });
  }

  addFiles() {
    this.addBinFiles();
    this.addLocaleFiles();
    this.addRootFiles();
    this.addSourceFiles();
  }

  addLocaleFiles() {
    this.archive.directory('locales');
  }

  addRootFiles() {
    for (const file of this.rootFiles) {
      this.archive.file(file);
    }
  }

  addSourceFiles() {
    this.archive.directory('src');
  }

  get binFilesToIgnore() {
    return ['bin/cli/update-help.js', 'bin/cli/watch.js'];
  }

  errorMessage(label = 'SourcePackager') {
    return `❌ [${label}] Failed to package source`;
  }

  get filePath() {
    return `${this.outputDir}/${this.packageName}.zip`;
  }

  get outputDir() {
    return `./release`;
  }

  get packageName() {
    return `source-${this.version}`;
  }

  get rootFiles() {
    return ['.build.json', '.nvmrc', 'LICENSE', 'package-lock.json', 'package.json', 'README.md', 'tsconfig.json'];
  }

  async run() {
    this.addFiles();

    return new Promise((resolve, reject) => {
      this.output.on('close', () => resolve());
      this.archive.on('error', reject);
      this.archive.finalize();
    });
  }

  successMessage(label = 'SourcePackager') {
    return `📦 [${label}] Source packaged
To build from source: npm install && npm run ci:release:firefox
Unpacked: ./dist`;
  }

  get version() {
    return this.build.version;
  }
}
