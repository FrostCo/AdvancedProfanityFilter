/* eslint-disable no-console */
import fse from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';

let buildData;
const buildDataPath = path.join('.build.json');
const dist = './dist/';
const releaseFilePath = path.join('.release.json');

function buildArchive() {
  const zip = new AdmZip();
  zip.addLocalFolder(dist, null);
  return zip;
}

function loadJSONFile(file) {
  try {
    return JSON.parse(fse.readFileSync(file));
  } catch (err) {
    console.error(err.message);
    throw err;
  }
}

function main() {
  try {
    // Load .release.json if present, otherwise load .build.json
    if (fse.existsSync(releaseFilePath)) {
      buildData = loadJSONFile(releaseFilePath);
    } else {
      buildData = loadJSONFile(buildDataPath);
    }

    const zip = buildArchive();
    const packagePath = `./${zipName()}.zip`;
    console.log(`Building ${packagePath}`);
    fse.removeSync(packagePath);
    zip.writeZip(packagePath);
  } catch (err) {
    console.error(err.message);
    throw (err);
  }
}

function zipName() {
  let name;

  if (buildData.target == 'chrome') {
    name = `extension-v${buildData.manifestVersion}`;
  } else {
    name = `extension-${buildData.target}`;
  }

  return name;
}

main();
