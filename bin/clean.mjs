/* eslint-disable no-console */
import fse from 'fs-extra';
import path from 'path';

const built = [
  path.join('extension'),
  path.join('extension-firefox'),
];

const dist = [
  path.join('dist'),
  path.join('dist-lib'),
];

const test = [
  path.join('test', 'built'),
];

function clean(items) {
  items.forEach((item) => {
    console.log(`Cleaning ${item}...`);
    fse.removeSync(item);
  });
}

function main() {
  try {
    // argv[0] = process (node)
    // argv[1] = script (this file)
    // argv[2] = first argument
    if (process.argv.length >= 2) {
      let args = process.argv.slice(2);
      if (args.length == 0 || args.includes('--all')) {
        args = ['--built', '--dist', '--release', '--test'];
      }

      let toRemove = [];
      if (args.includes('--built')) {
        toRemove = toRemove.concat(built);
      }

      if (args.includes('--dist')) {
        toRemove = toRemove.concat(dist);
      }

      if (args.includes('--test')) {
        toRemove = toRemove.concat(test);
      }

      clean(toRemove);
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
