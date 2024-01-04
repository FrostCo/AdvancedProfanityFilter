/* eslint-disable no-console */
import fse from 'fs-extra';
// import Constants from '../src/script/lib/constants'; // Temp?
import Common from './common.mjs';

export default class Prebuild {
  constructor(args) {
    this.loadedFromFile = false;
    this.data = this.defaultBuildData();
    this.environment = 'dev';
    this.environmentProvided = false;
    this.targetProvided = false;

    this.processArguments(args);
  }

  activateBuildFile(sourceFile) {
    fse.copyFileSync(sourceFile, Common.buildFilePath);
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

  error(msg) {
    console.error(msg);
    process.exit(1);
  }

  firefoxBuild() {
    // Target customizations
  }

  handleEnvArg(arg) {
    if (Common.environments.includes(arg)) {
      this.environmentProvided = true;
      return this.environment = arg;
    }
  }

  handleTargetArg(arg) {
    const [targetName, manifestVersion] = arg.split('-');
    if (!targetName) return;

    if (Common.targets.includes(targetName)) {
      this.data.target = targetName;
      if (manifestVersion) this.data.manifestVersion = parseInt(manifestVersion.match(/\d$/)?.toString());
      return this.targetProvided = true;
    }
  }

  loadDataFromFile() {
    this.loadedFromFile = true;
    const envBuildFilePath = Common.buildFilePathByEnv(this.environment);

    try {
      // Use existing buildFile as starting point if no target was passed
      this.data = Common.loadJSONFile(envBuildFilePath);
    } catch (err) {
      console.warn(`${envBuildFilePath} doesn't exist, creating with defaults...`);
      Common.writeJSONFile(envBuildFilePath, this.data);
    }
  }

  processArguments(args) {
    const argv = Common.parseArgv(args);
    argv.removeArgumentPrefixes('--');
    argv.removeEmptyArguments();
    if (argv.arguments.length > 2) this.error('Too many arguments provided.');

    if (argv.arguments.length >= 1) {
      for (const arg of argv.arguments) {
        if (this.handleEnvArg(arg)) continue;
        if (this.handleTargetArg(arg)) continue;
        this.error(`Unsupported argument: ${arg}`);
      }
    }

    if (argv.arguments.length == 0 || !this.targetProvided) this.loadDataFromFile();

    if (this.environment === 'release') this.data.release = true;
  }

  run() {
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
    const filePath = Common.buildFilePathByEnv(this.environment);
    Common.writeJSONFile(filePath, this.data);
    this.activateBuildFile(filePath);
    if (this.showBuildDetails) {
      console.log(`Build details:\n${JSON.stringify(this.data, null, 2)}`);
    }
  }
}
