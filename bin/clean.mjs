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

function clean(folders) {
  folders.forEach((folder) => {
    console.log(`Cleaning ${folder}...`);
    fse.removeSync(folder);
  });
}

function main() {
  try {
    // argv[0] = process (node)
    // argv[1] = script (this file)
    // argv[2] = first argument
    if (process.argv.length >= 2) {
      const args = process.argv.slice(2);
      let folders = [];

      if (args.length == 0 || args.includes('--all')) {
        folders = folders.concat(built).concat(dist).concat(test);
      } else {
        if (args.includes('--built')) {
          folders = folders.concat(built);
        }

        if (args.includes('--dist')) {
          folders = folders.concat(dist);
        }

        if (args.includes('--test')) {
          folders = folders.concat(test);
        }
      }

      clean(folders);
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
      npm run clean:dist
  `);
}

main();
