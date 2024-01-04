/* eslint-disable no-console */
import fse from 'fs-extra';

export default class CopyStatic {
  constructor() {
    this.toCopy = [];
    this.addCommonCopyPaths();
  }

  addCopyPath(source, destination) {
    this.toCopy.push({ source: source, destination: destination });
  }

  addCommonCopyPaths() {
    this.addCopyPath(`${this.srcPath}/static`, this.distPath);
    this.addCopyPath(`${this.srcPath}/img`, `${this.distPath}/img`);
  }

  get distPath() {
    return './dist';
  }

  run() {
    console.log('Copying static assets to ./dist folder...');

    for (const copyPath of this.toCopy) {
      fse.copySync(copyPath.source, copyPath.destination);
    }
  }

  get srcPath() {
    return './src';
  }
}
