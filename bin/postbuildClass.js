import fse from 'fs-extra';
import Common from './common.js';

export default class Postbuild {
  //#region Class reference helpers
  static get Common() { return Common; }
  get Class() { return (this.constructor); }
  //#endregion

  constructor() {
    this.buildData = this.Class.Common.loadJSONFile(this.Class.Common.buildFilePath);
    this.manifest = this.Class.Common.loadJSONFile(this.Class.Common.distManifestPath);
  }

  commonBuild() {
    this.handleManifest();
  }

  edgeLegacyBuild() {
    const msPreload = {
      backgroundScript: 'backgroundScriptsAPIBridge.js',
      contentScript: 'contentScriptsAPIBridge.js'
    };

    // Fix options_page
    this.manifest.options_page = this.manifest.options_ui.page;
    delete this.manifest.options_ui;

    // Add ms-proload polyfills
    this.manifest['-ms-preload'] = msPreload;
    fse.copyFileSync('./store/edge/src/backgroundScriptsAPIBridge.js', './dist/backgroundScriptsAPIBridge.js');
    fse.copyFileSync('./store/edge/src/contentScriptsAPIBridge.js', './dist/contentScriptsAPIBridge.js');
  }

  updateManifestVersion() {
    if (this.manifest.version != this.buildData.version) this.manifest.version = this.buildData.version;
  }

  firefoxBuild() {
    this.manifest.browser_specific_settings = {
      gecko: {
        id: '{853d1586-e2ab-4387-a7fd-1f7f894d2651}'
      }
    };

    switch (this.buildData.manifestVersion) {
      case 2: this.firefoxMv2Build(); break;
      case 3: this.firefoxMv3Build(); break;
    }
  }

  firefoxMv2Build() {
    this.manifest.background.persistent = false;
  }

  firefoxMv3Build() {
    this.manifest.background = {
      scripts: ['background.js'],
    };
  }

  handleManifest() {
    this.updateManifestVersion();
    this.handleManifestVersions();
  }

  handleManifestV2() {
    this.manifest.action = undefined;
    this.manifest.manifest_version = this.buildData.manifestVersion;
    this.manifest.options_ui = {
      chrome_style: false,
      open_in_tab: true,
      page: 'optionPage.html',
    };
    this.manifest.background = {
      persistent: false,
      scripts: ['background.js'],
    };
    this.manifest.browser_action = {
      default_icon: {
        '19': 'img/icon19.png',
        '38': 'img/icon38.png',
      },
      default_popup: 'popup.html',
      default_title: 'Advanced Profanity Filter',
    };
  }

  handleManifestV3() {
    // General customizations for all Manifest V3 builds
  }

  handleManifestVersions() {
    switch (this.buildData.manifestVersion) {
      case 2: this.handleManifestV2(); break;
      case 3: this.handleManifestV3(); break;
    }
  }

  run() {
    this.commonBuild();
    this.targetCustomizations();
    this.writeManifestFile();
  }

  targetCustomizations() {
    switch (this.buildData.target) {
      case 'edgeLegacy': this.edgeLegacyBuild(); break;
      case 'firefox': this.firefoxBuild(); break;
    }
  }

  writeManifestFile() {
    Common.writeJSONFile(Common.distManifestPath, this.manifest);
  }
}
