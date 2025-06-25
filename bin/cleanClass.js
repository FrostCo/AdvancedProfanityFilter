/* eslint-disable no-console */
import path from 'path';
import Common from './common.js';

export default class Clean {
  //#region Class reference helpers
  static get Common() {
    return Common;
  }
  get Class() {
    return this.constructor;
  }
  //#endregion

  constructor(args) {
    this.argv = this.Class.Common.parseArgv(args);
    this.arguments = this.argv.arguments;
    this.processArgs();
    this.toRemove = [];
  }

  addRemovePath(removePath) {
    this.toRemove.push(removePath);
  }

  addBuildPaths() {
    this.addRemovePath(path.join('dist', 'backgroundScriptsAPIBridge.js'));
    this.addRemovePath(path.join('dist', 'contentScriptsAPIBridge.js'));
  }

  addBuiltPaths() {
    this.addRemovePath(path.join('extension'));
    this.addRemovePath(path.join('extension-firefox'));
    this.addRemovePath(path.join('extension-edgeLegacy'));
  }

  addDistPaths() {
    this.addRemovePath(path.join('dist'));
    this.addRemovePath(path.join('dist-lib'));
  }

  get allArgs() {
    return { build: true, built: true, dist: true, test: true };
  }

  get defaultArgs() {
    return { built: true, dist: true, test: true };
  }

  get validArgs() {
    return ['all', 'build', 'built', 'dist', 'test'];
  }

  processArgs() {
    const invalidArgs = Object.keys(this.arguments).filter((arg) => !this.validArgs.includes(arg));
    if (invalidArgs.length) {
      console.error(`Unsupported arg: ${invalidArgs}`);
      this.usage();
      process.exit(1);
    }

    if (Object.keys(this.arguments).length === 0) {
      this.arguments = this.defaultArgs;
    } else if (this.arguments.all) {
      this.arguments = this.allArgs;
    }
  }

  run() {
    if (this.arguments.build) this.addBuildPaths();
    if (this.arguments.built) this.addBuiltPaths();
    if (this.arguments.dist) this.addDistPaths();
    if (this.arguments.test) this.addTestPaths();

    this.Class.Common.removeFiles(this.toRemove);
  }

  addTestPaths() {
    this.addRemovePath(path.join('test', 'built'));
  }

  usage() {
    console.log(`usage:
        npm run clean
        npm run clean:built
        npm run clean:dist
        npm run clean:test
    `);
  }
}
