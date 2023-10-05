/* eslint-disable no-console */
import fse from 'fs-extra';
// import Constants from '../src/script/lib/constants'; // Temp?
import { buildFilePath, devBuildFilePath, loadJSONFile, parseArgv, releaseBuildFilePath, writeJSONFile } from './lib.mjs';

export default class Prebuild {
  constructor(args) {
    this.loadedFromFile = false;
    this.data = this.defaultBuildData();
    this.loadBuildData(args);
  }

  activateBuildFile(sourceFile) {
    fse.copyFileSync(sourceFile, buildFilePath);
  }

  bookmarkletBuild() {
    this.data.target = 'bookmarklet';
    this.data.manifestVersion = 0;
  }

  chromeBuild() {
    switch (this.data.manifestVersion) {
      case 2: this.chromeMv2Build(); break;
      case 3: this.chromeMv3Build(); break;
    }
  }

  chromeMv2Build() {
    // Customizations for manifest version
  }

  chromeMv3Build() {
    // Customizations for manifest version
  }

  common() {
    this.data.version = process.env.npm_package_version;
  }

  defaultBuild() {
    this.chromeBuild();
  }

  defaultBuildData() {
    return {
      config: {},
      manifestVersion: 3,
      release: false,
      target: 'chrome',
      version: '1.0.0',
    };
  }

  edgeLegacyBuild() {
    // Target customizations
  }

  firefoxBuild() {
    // Target customizations
  }

  loadBuildData(args) {
    const argv = parseArgv(args);
    if (argv.count >= 2 && argv.count <= 4) {
      this.data.release = argv.arguments.includes('--release');
      if (this.data.release) {
        argv.arguments.splice(argv.arguments.indexOf('--release'), 1);
      }
      const target = argv.arguments[0]?.replace('--', '');
      if (target) {
        const targetArray = target.split('-');
        this.data.target = targetArray[0];
        if (targetArray.length == 2) {
          this.data.manifestVersion = parseInt(targetArray[1].match(/\d$/)?.toString()) || this.data.manifestVersion;
        }
      } else {
        this.loadedFromFile = true;
        // Use existing buildFile as starting point if no target was passed
        if (this.data.release && fse.existsSync(releaseBuildFilePath)) {
          this.data = loadJSONFile(releaseBuildFilePath);
        } else if (!this.data.release && fse.existsSync(devBuildFilePath)) {
          this.data = loadJSONFile(devBuildFilePath);
        }
      }
    } else {
      throw (new Error('Incorrect number of arguments.'));
    }
  }

  main() {
    this.common();
    this.targetCustomizations();
    this.writeBuildData();
  }

  get showBuildDetails() {
    // Only show build details if no target was passed or if this is a release
    return this.loadedFromFile || this.data.release;
  }

  targetCustomizations() {
    switch (this.data.target) {
      case 'bookmarklet':
        this.bookmarkletBuild();
        break;
      case 'chrome':
        this.chromeBuild();
        break;
      case 'edgeLegacy':
        this.edgeLegacyBuild();
        break;
      case 'firefox':
        this.firefoxBuild();
        break;
      default:
        // throw new Error(`Invalid target: ${this.data.target}`);
        console.warn('\n!!!!! NOTICE: using default build !!!!!\n');
        this.defaultBuild();
    }
  }

  writeBuildData() {
    const filePath = this.data.release ? releaseBuildFilePath : devBuildFilePath;
    writeJSONFile(filePath, this.data);
    this.activateBuildFile(filePath);
    if (this.showBuildDetails) {
      console.log(`Build details:\n${JSON.stringify(this.data, null, 2)}`);
    }
  }
}
