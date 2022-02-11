/* eslint-disable no-console */
import fse from 'fs-extra';
import path from 'path';
// import Constants from '../src/script/lib/constants'; // Temp?

const buildFilePath = path.join('.build.json');
const data = {
  config: {
    muteMethod: null,
  },
  manifestVersion: 2,
  target: 'chrome',
  version: '1.0.0',
};
const releaseFilePath = path.join('.release.json');

function common() {
  data.version = process.env.npm_package_version;
}

function defaultBuild() {
  manifestV3Build();
}

function firefoxBuild() {
  data.target = 'firefox';
}

function main() {
  // argv[0] = process (node)
  // argv[1] = script (this file)
  // argv[2] = first argument
  if (process.argv.length >= 2 && process.argv.length <= 4) {
    const args = process.argv.slice(2);
    const release = args.includes('--release');
    if (release) {
      args.splice(args.indexOf('--release'), 1);
    } else if (fse.existsSync(releaseFilePath)) {
      // Remove .release.json if it exists when not prepareing for a release build
      fse.removeSync(releaseFilePath);
    }
    const target = args[0];

    // Exit if no target was passed and .build.json already exists (preserve current build target)
    if (!target && fse.existsSync(buildFilePath)) {
      return;
    }

    common();

    switch (target) {
      case '--firefox':
        firefoxBuild();
        break;
      case '--manifestV2':
        manifestV2Build();
        break;
      case '--manifestV3':
        manifestV3Build();
        break;
      case '--safari':
        safariBuild();
        break;
      default:
        defaultBuild();
    }
    writeData(release);
  } else {
    throw (new Error('Incorrect number of arguments.'));
  }
}

function manifestV2Build() {
  data.manifestVersion = 2;
}

function manifestV3Build() {
  data.manifestVersion = 3;
}

function safariBuild() {
  data.target = 'safari';
  data.config.muteMethod = 2; // Constants.MUTE_METHODS.VIDEO_MUTE;
}

function writeData(release = false) {
  const filePath = release ? releaseFilePath : buildFilePath;
  const content = JSON.stringify(data, null, 2);
  fse.writeFileSync(filePath, content);
}

main();
