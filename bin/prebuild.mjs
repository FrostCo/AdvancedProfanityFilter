/* eslint-disable no-console */
import fse from 'fs-extra';
import path from 'path';
// import Constants from '../src/script/lib/constants'; // Temp?

const data = {
  config: {
    muteMethod: null,
  },
  manifestVersion: 2,
  target: 'Chrome',
  version: '1.0.0',
};

function appleBuild() {
  data.target = 'Safari';
  data.config.muteMethod = 2; // Constants.MUTE_METHODS.VIDEO_MUTE;
}

function chromeBuild() {

}

function defaultBuild() {

}

function usage() {
  console.log(`usage:
      npm prebuild [default]
      npm prebuild:apple
  `);
}

function general() {
  data.version = process.env.npm_package_version;
}

function writeData() {
  const content = JSON.stringify(data, null, 2);
  const buildFilePath = path.join('.build.json');
  fse.writeFileSync(buildFilePath, content);
}

function main() {
  try {
    // argv[0] = process (node)
    // argv[1] = script (this file)
    // argv[2] = first argument
    if (process.argv.length == 2 || process.argv.length == 3) {
      general();
      switch (process.argv[2]) {
        case '--apple':
          appleBuild();
          break;
        case '--chrome':
          chromeBuild();
          break;
        default:
          defaultBuild();
      }
      writeData();
    } else {
      usage();
    }
  } catch (error) {
    console.log(error);
    usage();
  }
}

main();
