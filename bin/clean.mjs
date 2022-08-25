/* eslint-disable no-console */
import path from 'path';
import { parseArgv, removeFiles } from './lib.mjs';

const built = [
  path.join('extension'),
  path.join('extension-firefox'),
  path.join('extension-edgeLegacy'),
];

const dist = [
  path.join('dist'),
  path.join('dist-lib'),
];

const test = [
  path.join('test', 'built'),
];

function main() {
  try {
    const argv = parseArgv(process.argv);
    if (argv.count >= 2) {
      if (argv.arguments.length == 0 || argv.arguments.includes('--all')) {
        argv.arguments = ['--built', '--dist', '--test'];
      }

      let toRemove = [];
      if (argv.arguments.includes('--built')) {
        toRemove = toRemove.concat(built);
      }

      if (argv.arguments.includes('--dist')) {
        toRemove = toRemove.concat(dist);
      }

      if (argv.arguments.includes('--test')) {
        toRemove = toRemove.concat(test);
      }

      removeFiles(toRemove);
    } else {
      usage();
    }
  } catch (error) {
    console.log(error);
    usage();
  }
}

function usage() {
  console.log(`usage:
      npm run clean
      npm run clean:built
      npm run clean:dist
      npm run clean:test
  `);
}

main();
