/* eslint-disable no-console */
import fse from 'fs-extra';
// import Constants from '../src/script/lib/constants'; // Temp?
import { buildFilePath, devBuildFilePath, loadJSONFile, parseArgv, releaseBuildFilePath, writeJSONFile } from './lib.mjs';

let data = {
  config: {},
  manifestVersion: 3,
  release: false,
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

function chromeBuild() {
  switch (data.manifestVersion) {
    case 2: chromeMv2Build(); break;
    case 3: chromeMv3Build(); break;
  }
}

function chromeMv2Build() {
  // Customizations for manifest version
}

function chromeMv3Build() {
  // Customizations for manifest version
}

function common() {
  data.version = process.env.npm_package_version;
}

function defaultBuild() {
  chromeBuild();
}

function edgeLegacyBuild() {
  // Target customizations
}

function firefoxBuild() {
  // Target customizations
}

function main() {
  const argv = parseArgv(process.argv);
  if (argv.count >= 2 && argv.count <= 4) {
    data.release = argv.arguments.includes('--release');
    if (data.release) {
      argv.arguments.splice(argv.arguments.indexOf('--release'), 1);
    }
    const target = argv.arguments[0]?.replace('--', '');

    if (target) {
      const targetArray = target.split('-');
      data.target = targetArray[0];
      if (targetArray.length == 2) {
        data.manifestVersion = parseInt(targetArray[1].match(/\d$/)?.toString()) || data.manifestVersion;
      }
    } else {
      // Use existing buildFile as starting point if no target was passed
      if (data.release && fse.existsSync(releaseBuildFilePath)) {
        data = loadJSONFile(releaseBuildFilePath);
      } else if (!data.release && fse.existsSync(devBuildFilePath)) {
        data = loadJSONFile(devBuildFilePath);
      }
    }

    // Only show build details if no target was passed or if this is a release
    const showBuildDetails = (!target || data.release);

    common();

    switch (data.target) {
      case 'bookmarklet':
        bookmarkletBuild();
        break;
      case 'chrome':
        chromeBuild();
        break;
      case 'edgeLegacy':
        edgeLegacyBuild();
        break;
      case 'firefox':
        firefoxBuild();
        break;
      default:
        // throw new Error(`Invalid target: ${data.target}`);
        console.warn('\n!!!!! NOTICE: using default build !!!!!\n');
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

main();
