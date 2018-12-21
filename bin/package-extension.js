'use strict';
const fse = require('fs-extra');
const path = require('path');
const AdmZip = require('adm-zip');

function buildAll() {
  buildChrome(prepareZip());
  buildEdge(getManifestJSON(), prepareZip());
  buildFirefox(getManifestJSON(), prepareZip());
  buildOpera(prepareZip());
}

function buildChrome(zip) {
  console.log('Building ./extension-chrome.zip');
  fse.removeSync('./extension-chrome.zip');
  zip.writeZip('./extension-chrome.zip');
}

function buildEdge(manifest, zip) {
  console.log('Building ./extension-edge.zip');
  let msPreload = {
    backgroundScript: "backgroundScriptsAPIBridge.js",
    contentScript: "contentScriptsAPIBridge.js"
  }

  // Fix options_page
  manifest.options_page = manifest.options_ui.page;
  delete manifest.options_ui;

  // Add ms-proload polyfills
  manifest['-ms-preload'] = msPreload;
  updateManifestFileInZip(zip, manifest);
  zip.addLocalFile('./store/edge/src/backgroundScriptsAPIBridge.js', null);
  zip.addLocalFile('./store/edge/src/contentScriptsAPIBridge.js', null);
  fse.removeSync('./extension-edge.zip');
  zip.writeZip('./extension-edge.zip');
}

function buildFirefox(manifest, zip) {
  console.log('Building ./extension-firefox.zip');
  let firefoxManifest = {
    "applications": {
      "gecko": {
        "id": "{853d1586-e2ab-4387-a7fd-1f7f894d2651}"
      }
    }
  };
  manifest.applications = firefoxManifest.applications;
  updateManifestFileInZip(zip, manifest);
  fse.removeSync('./extension-firefox.zip');
  zip.writeZip('./extension-firefox.zip');

  packageSource(); // Required due to bundled code
}

function buildOpera(zip) {
  console.log('Building ./extension-opera.zip');
  fse.removeSync('./extension-opera.zip');
  zip.writeZip('./extension-opera.zip');
}

function getManifestJSON() {
  return JSON.parse(fse.readFileSync(manifestPath));
}

function packageSource() {
  fse.removeSync('./extension-source.zip');
  console.log('Building ./extension-source.zip');
  console.log('Build from source: npm install && npm run build && npm run package-no-build');

  let sourceZip = new AdmZip();
  let files = [
    '.eslintrc.json',
    'LICENSE',
    'package.json',
    'package-lock.json',
    'README.md',
    'tsconfig.json'
  ];
  sourceZip.addLocalFolder('./bin', 'bin');
  sourceZip.addLocalFolder('./src', 'src');
  sourceZip.addLocalFolder('./static', 'static');
  sourceZip.addLocalFolder('./test', 'test');
  files.forEach(file => { sourceZip.addLocalFile(path.join('./', file), null)});
  sourceZip.writeZip('./extension-source.zip');
}

function prepareZip() {
  let zip = new AdmZip();
  zip.addLocalFolder(dist, null);
  return zip;
}

function updateManifestFile(file, obj) {
  let content = JSON.stringify(obj, null, 2);
  fse.writeFileSync(file, content);
}

function updateManifestFileInZip(zip, obj) {
  let content = JSON.stringify(obj, null, 2);
  zip.updateFile('manifest.json', Buffer.alloc(content.length, content));
}

function updateManifestVersion(manifestPath, manifest) {
  if (manifest.version != process.env.npm_package_version) {
    console.log('Version number is being updated: ' + manifest.version + ' -> ' + process.env.npm_package_version)
    manifest.version = process.env.npm_package_version || manifest.version;
    updateManifestFile(manifestPath, manifest);
    fse.copyFileSync(manifestPath, path.join(dist, 'manifest.json'));
  }
}

const dist = './dist/'
const staticDir = './static/'
let manifestPath = path.join(staticDir, 'manifest.json');
updateManifestVersion(manifestPath, getManifestJSON());
buildAll();