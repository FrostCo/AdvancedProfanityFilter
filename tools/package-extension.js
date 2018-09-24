'use strict';

const fse = require('fs-extra');
const path = require('path');
const AdmZip = require('adm-zip');

function buildChrome(zip) {
  fse.removeSync('./extension-chrome.zip');
  console.log('Building ./extension-chrome.zip');
  zip.deleteFile('webFilter.js'); // Remove filter.js as its only used for testing
  zip.writeZip('./extension-chrome.zip');
}

function buildFirefox(manifest, zip) {
  fse.removeSync('./extension-firefox.zip');
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
  zip.writeZip('./extension-firefox.zip');
}

function buildOpera(zip) {
  fse.removeSync('./extension-opera.zip');
  console.log('Building ./extension-opera.zip');
  zip.writeZip('./extension-opera.zip');
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
  sourceZip.addLocalFolder('./src', 'src');
  sourceZip.addLocalFolder('./static', 'static');
  sourceZip.addLocalFolder('./test', 'test');
  sourceZip.addLocalFolder('./tools', 'tools');
  files.forEach(file => { sourceZip.addLocalFile(path.join('./', file), null)});
  sourceZip.writeZip('./extension-source.zip');
}

const dist = './dist/'
const staticDir = './static/'
let zip = new AdmZip();
let manifestPath = path.join(staticDir, 'manifest.json');
let manifest = JSON.parse(fse.readFileSync(manifestPath));
updateManifestVersion(manifestPath, manifest);
zip.addLocalFolder(dist, null);
buildChrome(zip);
buildOpera(zip);
buildFirefox(manifest, zip);

// Required for Firefox
packageSource();