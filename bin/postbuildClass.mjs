/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
import fse from 'fs-extra';
import {
  buildFilePath,
  distManifestPath,
  loadJSONFile,
  writeJSONFile
} from './lib.mjs';

export default class Postbuild {
  constructor() {
    this.buildData = loadJSONFile(buildFilePath);
    this.manifest = loadJSONFile(distManifestPath);
  }

  common() {
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
    this.manifest.background.persistent = true; // Event pages are not supported
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
    this.manifest.permissions.splice(this.manifest.permissions.indexOf('scripting'), 1);
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

  main() {
    this.common();
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
    writeJSONFile(distManifestPath, this.manifest);
  }
}

const postbuild = new Postbuild();
postbuild.main();
