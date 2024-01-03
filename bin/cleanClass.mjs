/* eslint-disable no-console */
import path from 'path';
import { parseArgv, removeFiles } from './lib.mjs';

export default class Clean {
  constructor() {
    this.arguments = this.parseArgs();
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

  get defaultArgs() {
    return ['--built', '--dist', '--test'];
  }

  parseArgs() {
    try {
      const argv = parseArgv(process.argv);
      if (argv.count >= 2) {
        if (argv.arguments.length == 0 || argv.arguments.includes('--all')) {
          return this.defaultArgs;
        }

        return argv.arguments;
      } else {
        this.usage();
      }
    } catch (error) {
      console.log(error);
      this.usage();
    }
  }

  run() {
    if (this.arguments.includes('--build')) this.addBuildPaths();
    if (this.arguments.includes('--built')) this.addBuiltPaths();
    if (this.arguments.includes('--dist')) this.addDistPaths();
    if (this.arguments.includes('--test')) this.addTestPaths();

    removeFiles(this.toRemove);
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
