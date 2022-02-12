/* eslint-disable no-console */
import fse from 'fs-extra';
// import Constants from '../src/script/lib/constants'; // Temp?
import { buildFilePath, parseArgv, releaseFilePath, removeFiles, writeJSONFile } from './lib.mjs';

const data = {
  config: {
    muteMethod: null,
  },
  manifestVersion: 2,
  target: 'chrome',
  version: '1.0.0',
};

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
  const argv = parseArgv(process.argv);
  if (argv.count >= 2 && argv.count <= 4) {
    const release = argv.arguments.includes('--release');
    if (release) {
      argv.arguments.splice(argv.arguments.indexOf('--release'), 1);
    } else if (fse.existsSync(releaseFilePath)) {
      // Remove .release.json if it exists when not prepareing for a release build
      removeFiles(releaseFilePath);
    }
    const target = argv.arguments[0];

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

    const filePath = release ? releaseFilePath : buildFilePath;
    writeJSONFile(filePath, data);
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

main();
