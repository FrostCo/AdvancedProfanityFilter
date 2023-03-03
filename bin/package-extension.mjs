/* eslint-disable no-console */
import AdmZip from 'adm-zip';
import { globbySync } from 'globby';
import { buildFilePath, loadJSONFile, removeFiles } from './lib.mjs';

let buildData;
const dist = './dist/';

function buildArchive() {
  const zip = new AdmZip();
  zip.addLocalFolder(dist, null);

  // Remove unwanted files
  const filesToRemove = globbySync(['dist/**/*.LICENSE.txt']);
  for (const file of filesToRemove) {
    const entry = file.replace(/^dist\//, '');
    zip.deleteFile(entry);
  }

  return zip;
}

function main() {
  try {
    buildData = loadJSONFile(buildFilePath);

    const zip = buildArchive();
    const packagePath = `./${zipName()}.zip`;
    removeFiles(packagePath, true);
    console.log(`Building ${packagePath}`);
    zip.writeZip(packagePath);
  } catch (err) {
    console.error(err.message);
    throw (err);
  }
}

function zipName() {
  let name;

  if (buildData.target == 'chrome') {
    name = `extension-mv${buildData.manifestVersion}`;
  } else {
    name = `extension-${buildData.target}`;
  }

  return name;
}

main();
