/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
import fse from 'fs-extra';
import {
  buildFilePath,
  distManifestPath,
  loadJSONFile,
  writeJSONFile
} from './lib.mjs';

let buildData;
let manifest;

function common() {
  handleManifest();
}

function edgeLegacyBuild() {
  const msPreload = {
    backgroundScript: 'backgroundScriptsAPIBridge.js',
    contentScript: 'contentScriptsAPIBridge.js'
  };

  // Fix options_page
  manifest.options_page = manifest.options_ui.page;
  delete manifest.options_ui;

  // Add ms-proload polyfills
  manifest['-ms-preload'] = msPreload;
  fse.copyFileSync('./store/edge/src/backgroundScriptsAPIBridge.js', './dist/backgroundScriptsAPIBridge.js');
  fse.copyFileSync('./store/edge/src/contentScriptsAPIBridge.js', './dist/contentScriptsAPIBridge.js');
}

function firefoxBuild() {
  manifest.browser_specific_settings = {
    gecko: {
      id: '{853d1586-e2ab-4387-a7fd-1f7f894d2651}'
    }
  };
  manifest.background.persistent = true; // Event pages are not currently supported.
}

function handleManifest() {
  if (manifest.version != buildData.version) manifest.version = buildData.version;

  if (buildData.manifestVersion == 2) {
    manifest.permissions.splice(manifest.permissions.indexOf('scripting'), 1);
    manifest.action = undefined;
    manifest.manifest_version = buildData.manifestVersion;
    manifest.options_ui = {
      chrome_style: false,
      open_in_tab: true,
      page: 'optionPage.html',
    };
    manifest.background = {
      persistent: false,
      scripts: ['background.js'],
    };
    manifest.browser_action = {
      default_icon: {
        '19': 'img/icon19.png',
        '38': 'img/icon38.png',
      },
      default_popup: 'popup.html',
      default_title: 'Advanced Profanity Filter',
    };
  }
}

function main() {
  buildData = loadJSONFile(buildFilePath);
  manifest = loadJSONFile(distManifestPath);

  // Perform postbuild actions
  common();

  if (buildData.target == 'edgeLegacy') edgeLegacyBuild();

  if (buildData.target == 'firefox') firefoxBuild();

  writeJSONFile(distManifestPath, manifest);
}

main();
