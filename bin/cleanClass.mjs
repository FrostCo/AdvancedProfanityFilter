/* eslint-disable no-console */
import path from 'path';
import { parseArgv, removeFiles } from './lib.mjs';

export default class Clean {
  constructor() {
    this.toRemove = [];
    this.arguments = [];
  }

  get buildPaths() {
    return [
      path.join('dist', 'backgroundScriptsAPIBridge.js'),
      path.join('dist', 'contentScriptsAPIBridge.js'),
    ];
  }

  get builtPaths() {
    return [
      path.join('extension'),
      path.join('extension-firefox'),
      path.join('extension-edgeLegacy'),
    ];
  }

  get distPaths() {
    return [
      path.join('dist'),
      path.join('dist-lib'),
    ];
  }

  run() {
    try {
      const argv = parseArgv(process.argv);
      if (argv.count >= 2) {
        if (argv.arguments.length == 0 || argv.arguments.includes('--all')) {
          argv.arguments = ['--built', '--dist', '--test'];
        }

        if (argv.arguments.includes('--build')) this.toRemove = this.toRemove.concat(this.buildPaths);
        if (argv.arguments.includes('--built')) this.toRemove = this.toRemove.concat(this.builtPaths);
        if (argv.arguments.includes('--dist')) this.toRemove = this.toRemove.concat(this.distPaths);
        if (argv.arguments.includes('--test')) this.toRemove = this.toRemove.concat(this.testPaths);

        removeFiles(this.toRemove);
      } else {
        this.usage();
      }
    } catch (error) {
      console.log(error);
      this.usage();
    }
  }

  get testPaths() {
    return [
      path.join('test', 'built'),
    ];
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
