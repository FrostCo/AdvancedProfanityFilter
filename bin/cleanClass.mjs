/* eslint-disable no-console */
import path from 'path';
import { parseArgv, removeFiles } from './lib.mjs';

export default class Clean {
  constructor() {
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

  run() {
    try {
      const argv = parseArgv(process.argv);
      if (argv.count >= 2) {
        if (argv.arguments.length == 0 || argv.arguments.includes('--all')) {
          argv.arguments = ['--built', '--dist', '--test'];
        }

        if (argv.arguments.includes('--build')) this.addBuildPaths();
        if (argv.arguments.includes('--built')) this.addBuiltPaths();
        if (argv.arguments.includes('--dist')) this.addDistPaths();
        if (argv.arguments.includes('--test')) this.addTestPaths();

        removeFiles(this.toRemove);
      } else {
        this.usage();
      }
    } catch (error) {
      console.log(error);
      this.usage();
    }
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
