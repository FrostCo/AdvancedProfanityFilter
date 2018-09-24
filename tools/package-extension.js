'use strict';

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

function buildChrome(zip) {
  console.log('Building ./extension-chrome.zip');
  // try { fs.unlinkSync('./dist/filter.js'); } catch {}; // Remove filter.js as its only used for testing
  zip.deleteFile('webFilter.js'); // Remove filter.js as its only used for testing
  zip.writeZip(path.join(dist, './extension-chrome.zip'));
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
  zip.writeZip(path.join(dist, './extension-firefox.zip'));
}

function buildOpera(zip) {
  console.log('Building ./extension-opera.zip');
  // try { fs.unlinkSync('./dist/filter.js'); } catch {}; // Remove filter.js as its only used for testing
  zip.deleteFile('webFilter.js'); // Remove filter.js as its only used for testing
  zip.writeZip(path.join(dist, './extension-opera.zip'));
}

function updateManifestFile(file, obj) {
  let content = JSON.stringify(obj, null, 2);
  fs.writeFileSync(file, content);
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
    fs.copyFileSync(manifestPath, path.join(dist, 'manifest.json'));
  }
}

const dist = './dist/'
const staticDir = './static/'
let zip = new AdmZip();
let manifestPath = path.join(staticDir, 'manifest.json');
let manifest = JSON.parse(fs.readFileSync(manifestPath));
updateManifestVersion(manifestPath, manifest);
zip.addLocalFolder(dist, null);
buildChrome(zip);
buildOpera(zip);
buildFirefox(manifest, zip);