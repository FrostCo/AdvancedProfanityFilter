/* eslint-disable no-console */
import fse from 'fs-extra';
// import Constants from '../src/script/lib/constants'; // Temp?
import { buildFilePath, devBuildFilePath, loadJSONFile, parseArgv, releaseBuildFilePath, writeJSONFile } from './lib.mjs';

let data = {
  release: false,
  config: {},
  manifestVersion: 2,
  target: 'chrome',
  version: '1.0.0',
};

function activateBuildFile(sourceFile) {
  fse.copyFileSync(sourceFile, buildFilePath);
}

function bookmarkletBuild() {
  data.target = 'bookmarklet';
  data.manifestVersion = 0;
}

function common() {
  data.version = process.env.npm_package_version;
}

function defaultBuild() {
  manifestV2Build();
}

function edgeLegacyBuild() {
  data.target = 'edgeLegacy';
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
    let target = argv.arguments[0];

    // Only show build details if no target was passed or if this is a release
    const showBuildDetails = (!target || data.release);

    // Use existing buildFile as starting point if no target was passed
    if (!target) {
      if (data.release && fse.existsSync(releaseBuildFilePath)) {
        data = loadJSONFile(releaseBuildFilePath);
        target = targetFromData();
      } else if (!data.release && fse.existsSync(devBuildFilePath)) {
        data = loadJSONFile(devBuildFilePath);
        target = targetFromData();
      }
    }

    common();

    switch (target) {
      case '--bookmarklet':
        bookmarkletBuild();
        break;
      case '--edgeLegacy':
        edgeLegacyBuild();
        break;
      case '--firefox':
        firefoxBuild();
        break;
      case '--manifestV2':
        manifestV2Build();
        break;
      case '--manifestV3':
        manifestV3Build();
        break;
      default:
        defaultBuild();
    }

    const filePath = data.release ? releaseBuildFilePath : devBuildFilePath;
    writeJSONFile(filePath, data);
    activateBuildFile(filePath);
    if (showBuildDetails) {
      console.log(`Build details:\n${JSON.stringify(data, null, 2)}`);
    }
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

function targetFromData() {
  switch (data.target) {
    case 'chrome':
      return `--manifestV${data.manifestVersion}`;
    case 'bookmarklet':
    case 'firefox:':
      return `--${data.target}`;
  }
}

main();
