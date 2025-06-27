/* eslint-disable no-console */
import AdmZip from 'adm-zip';
import Common from '../common.js';

// Required for Firefox due to bundled code
export default class SourcePackager {
  //#region Class reference helpers
  static get Common() {
    return Common;
  }
  get Class() {
    return this.constructor;
  }
  //#endregion

  constructor() {
    this.zip = new AdmZip();
  }

  addBinFiles() {
    for (const file of this.binFiles) {
      this.zip.addLocalFile(file, 'bin/');
    }
  }

  addFiles() {
    this.addBinFiles();
    this.addRootFiles();
    this.addSourceFiles();
  }

  addRootFiles() {
    for (const file of this.rootFiles) {
      this.zip.addLocalFile(file);
    }
  }

  addSourceFiles() {
    this.zip.addLocalFolder('./src', 'src');
  }

  get binFiles() {
    return [
      'bin/clean.js',
      'bin/cleanClass.js',
      'bin/common.js',
      'bin/copyStatic.js',
      'bin/copyStaticClass.js',
      'bin/packageExtension.js',
      'bin/packageExtensionClass.js',
      'bin/packageSource.js',
      'bin/packageSourceClass.js',
      'bin/postbuild.js',
      'bin/postbuildClass.js',
      'bin/prebuild.js',
      'bin/prebuildClass.js',
      'bin/webpack.bookmarklet.js',
      'bin/webpack.common.js',
      'bin/webpack.dev.js',
      'bin/webpack.prod.js',
    ];
  }

  get filePath() {
    return `./release/source-${this.version}.zip`;
  }

  get rootFiles() {
    return ['.build.json', 'LICENSE', 'package-lock.json', 'package.json', 'README.md', 'tsconfig.json'];
  }

  run() {
    this.Class.Common.removeFiles(this.filePath, true);
    this.showInstructions();
    this.addFiles();
    this.zip.writeZip(this.filePath);
  }

  showInstructions() {
    console.log(`Building ${this.filePath}`);
    console.log('Build from source: npm install && npm run release:bookmarklet && npm run release:firefox');
    console.log('  Unpacked: ./dist');
    console.log(`  Packed: ${this.filePath}`);
  }

  get version() {
    return process.env.npm_package_version;
  }
}
