'use strict';

const fs = require('fs');
const path = require('path');
var AdmZip = require('adm-zip');

var zip = new AdmZip();
var dist = './dist/'

function updateManifestFile(zip, obj) {
  var content = JSON.stringify(obj, null, 2);
  zip.updateFile('manifest.json', Buffer.alloc(content.length, content));
}

// Chrome Extension
// try { fs.unlinkSync('./dist/filter.js'); } catch {};
zip.addLocalFolder(dist, null)
var manifest = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.json')));
manifest.version = process.env.npm_package_version || manifest.version;
updateManifestFile(zip, manifest);
zip.deleteFile('filter.js'); // Remove filter.js as its only used for testing. Use filter.bundle.js instead
zip.writeZip('./extension-chrome.zip');

// Firefox Extension
var firefoxManifest = {
  "applications": {
    "gecko": {
      "id": "{853d1586-e2ab-4387-a7fd-1f7f894d2651}"
    }
  }
};
manifest.applications = firefoxManifest.applications;
updateManifestFile(zip, manifest);
zip.writeZip('./extension-firefox.zip');

// function walkSync(dir, filelist = []) {
//   fs.readdirSync(dir).forEach(file => {
//     const dirFile = path.join(dir, file);
//     try {
//         filelist = walkSync(dirFile, filelist);
//     }
//     catch (err) {
//         if (err.code === 'ENOTDIR' || err.code === 'EBUSY') filelist = [...filelist, dirFile];
//         else throw err;
//     }
//   });
//   return filelist;
// }

// var files = walkSync(dist);
// files.forEach(file => { zip.addLocalFile(file); });