/* eslint-disable no-console */
import path from 'path';
import Common from './common.mjs';

export default class Clean {
  constructor(args) {
    this.argv = Common.parseArgv(args);
    this.argv.removeArgumentPrefixes('--');
    this.argv.removeEmptyArguments();
    this.arguments = argv.arguments;
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
    return ['build', 'built', 'dist', 'test'];
  }

  get defaultArgs() {
    return ['built', 'dist', 'test'];
  }

  processArgs() {
    if (this.arguments.length === 0) {
      this.arguments = this.defaultArgs;
    } else if (this.arguments.includes('all')) {
      this.arguments = this.allArgs;
    }
  }

  run() {
    if (this.arguments.includes('build')) this.addBuildPaths();
    if (this.arguments.includes('built')) this.addBuiltPaths();
    if (this.arguments.includes('dist')) this.addDistPaths();
    if (this.arguments.includes('test')) this.addTestPaths();

    Common.removeFiles(this.toRemove);
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
