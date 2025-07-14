import fse from 'fs-extra';
// import Constants from '../../src/script/lib/constants'; // Temp?
import BuildUtils from './BuildUtils.js';

export default class Prebuild {
  //#region Class reference helpers
  static get BuildUtils() {
    return BuildUtils;
  }
  get Class() {
    return this.constructor;
  }
  //#endregion

  constructor(args) {
    this.loadedFromFile = false;
    this.data = this.defaultBuildData();
    this.environment = 'dev';
    this.environmentProvided = false;
    this.targetProvided = false;
    this.warnings = [];

    this.processArguments(args);
  }

  activateBuildFile(sourceFile) {
    fse.copyFileSync(sourceFile, this.Class.BuildUtils.buildFilePath);
  }

  bookmarkletBuild() {
    this.data.target = 'bookmarklet';
    this.data.manifestVersion = 0;
  }

  chromeBuild() {
    switch (this.data.manifestVersion) {
      case 2:
        this.chromeMv2Build();
        break;
      case 3:
        this.chromeMv3Build();
        break;
    }
  }

  chromeMv2Build() {
    // Customizations for manifest version
  }

  chromeMv3Build() {
    // Customizations for manifest version
  }

  commonBuild() {
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

  errorMessage(label = 'Prebuild') {
    return `❌ [${label}] Prebuild tasks failed`;
  }

  firefoxBuild() {
    // Target customizations
  }

  handleEnvArg(arg) {
    if (this.Class.BuildUtils.environments.includes(arg)) {
      this.environmentProvided = true;
      return (this.environment = arg);
    }
  }

  handleTargetArg(arg) {
    const [targetName, manifestVersion] = arg.split('-');
    if (!targetName) return;

    if (this.Class.BuildUtils.targets.includes(targetName)) {
      this.data.target = targetName;
      if (manifestVersion) this.data.manifestVersion = parseInt(manifestVersion.match(/\d$/)?.toString());
      return (this.targetProvided = true);
    } else {
      throw new Error(`Unsupported target: ${arg}`);
    }
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  get hasWarnings() {
    return this.warnings.length > 0;
  }

  loadDataFromFile() {
    this.loadedFromFile = true;
    const envBuildFilePath = this.Class.BuildUtils.buildFilePathByEnv(this.environment);

    try {
      // Use existing buildFile as starting point if no target was passed
      this.data = this.Class.BuildUtils.loadJSONFile(envBuildFilePath);
    } catch (err) {
      // Create with defaults if file doesn't exist
      this.addWarning(`${envBuildFilePath} doesn't exist, creating with defaults...`);
      this.Class.BuildUtils.writeJSONFile(envBuildFilePath, this.data);
    }
  }

  processArguments(args) {
    const argv = this.Class.BuildUtils.parseArgv(args);
    const invalidArgs = Object.keys(argv.arguments).filter((arg) => !this.validArgs.includes(arg));
    if (invalidArgs.length) {
      throw new Error(`Unsupported arg: ${invalidArgs}`);
    }

    if (argv.arguments.target) this.handleTargetArg(argv.arguments.target);
    if (argv.arguments.environment) this.handleEnvArg(argv.arguments.environment);
    if (!this.targetProvided) this.loadDataFromFile();
    if (this.environment === 'release') this.data.release = true;
  }

  run() {
    this.commonBuild();
    this.targetCustomizations();
    this.writeBuildData();
  }

  successMessage(label = 'Prebuild') {
    return `🔨 [${label}] Prebuild tasks completed`;
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
        this.addWarning('Using default build target: chrome');
        this.defaultBuild();
    }
  }

  usage() {
    return `usage:
        npm run build
        npm run build:chrome
        npm run build:chrome:mv2
    `;
  }

  get validArgs() {
    return ['environment', 'target'];
  }

  writeBuildData() {
    const filePath = this.Class.BuildUtils.buildFilePathByEnv(this.environment);
    this.Class.BuildUtils.writeJSONFile(filePath, this.data);
    this.activateBuildFile(filePath);
  }
}
