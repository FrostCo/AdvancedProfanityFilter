/* eslint-disable no-console */
import fse from 'fs-extra';
// import Constants from '../src/script/lib/constants'; // Temp?
import { buildFilePath, devBuildFilePath, loadJSONFile, parseArgv, releaseBuildFilePath, writeJSONFile } from './lib.mjs';

let data = {
  release: false,
  config: {
    muteMethod: null,
  },
  manifestVersion: 2,
  target: 'chrome',
  version: '1.0.0',
};

function activateBuildFile(sourceFile) {
  fse.copyFileSync(sourceFile, buildFilePath);
}

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
    data.release = argv.arguments.includes('--release');
    if (data.release) {
      argv.arguments.splice(argv.arguments.indexOf('--release'), 1);
    }

    // Use existing buildFile as starting point if no target was passed
    const target = argv.arguments[0];
    if (!target && data.release && fse.existsSync(releaseBuildFilePath)) {
      data = loadJSONFile(releaseBuildFilePath);
    } else if (!target && !data.release && fse.existsSync(devBuildFilePath)) {
      data = loadJSONFile(devBuildFilePath);
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

    const filePath = data.release ? releaseBuildFilePath : devBuildFilePath;
    writeJSONFile(filePath, data);
    activateBuildFile(filePath);
    console.log(`Build details:\n${JSON.stringify(data, null, 2)}`);
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
