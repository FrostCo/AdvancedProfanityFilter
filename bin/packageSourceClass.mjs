/* eslint-disable no-console */
import AdmZip from 'adm-zip';
import Common from './common.mjs';

// Required for Firefox due to bundled code
export default class PackageSource {
  constructor() {
    this.zip = new AdmZip();
  }

  addBinFiles() {
    for (const file of this.binFiles) { this.zip.addLocalFile(file, 'bin/'); }
  }

  addFiles() {
    this.addBinFiles();
    this.addRootFiles();
    this.addSourceFiles();
  }

  addRootFiles() {
    for (const file of this.rootFiles) { this.zip.addLocalFile(file); }
  }

  addSourceFiles() {
    this.zip.addLocalFolder('./src', 'src');
  }

  get binFiles() {
    return [
      'bin/clean.mjs',
      'bin/cleanClass.mjs',
      'bin/common.mjs',
      'bin/copyStatic.mjs',
      'bin/copyStaticClass.mjs',
      'bin/packageExtension.mjs',
      'bin/packageExtensionClass.mjs',
      'bin/packageSource.mjs',
      'bin/packageSourceClass.mjs',
      'bin/postbuild.mjs',
      'bin/postbuildClass.mjs',
      'bin/prebuild.mjs',
      'bin/prebuildClass.mjs',
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
    return [
      '.build.json',
      'LICENSE',
      'package-lock.json',
      'package.json',
      'README.md',
      'tsconfig.json',
    ];
  }

  run() {
    Common.removeFiles(this.filePath, true);
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
