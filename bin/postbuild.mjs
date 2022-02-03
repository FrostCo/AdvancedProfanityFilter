/* eslint-disable no-console */
import fse from 'fs-extra';
import path from 'path';

const buildDataPath = path.join('.build.json');
const manifestPath = path.join('dist', 'manifest.json');
const manifestV3Path = path.join('dist', 'manifestV3.json');

function common() {
  handleManifestVersion();
  handleVersion();
}

function firefoxBuild() {
  const manifest = loadJSONFile(manifestPath);
  manifest.applications = {
    gecko: {
      id: '{853d1586-e2ab-4387-a7fd-1f7f894d2651}'
    }
  };
  writeJSONFile(manifestPath, manifest);
}

function handleManifestVersion() {
  if (buildData.manifestVersion == 3) {
    fse.renameSync(manifestV3Path, manifestPath);
  } else {
    fse.removeSync(manifestV3Path);
  }
}

function handleVersion() {
  const manifest = loadJSONFile(manifestPath);

  if (manifest.version != buildData.version) {
    console.log(`Updating manifest.json version (${manifest.version} -> ${buildData.version})`);
    manifest.version = buildData.version;
    writeJSONFile(manifestPath, manifest);
  }
}

function loadJSONFile(file) {
  return JSON.parse(fse.readFileSync(file));
}

function main() {
  buildData = loadJSONFile(buildDataPath);
  common();

  if (buildData.target == 'firefox') {
    firefoxBuild();
  }

  if (buildData.target == 'safari') {
    safariBuild();
  }
}

function removeFiles(files) {
  if (typeof files === 'string') {
    files = [files];
  }

  files.forEach((file) => {
    console.log(`Removing ${file}`);
    fse.removeSync(file);
  });
}

function removeOptionPageDonations() {
  console.log("Removing donations from Option's page");
  const optionPage = path.join('dist', 'optionPage.html');
  const optionPageHTML = fse.readFileSync(optionPage).toString();

  // Remove span.donations
  const donationsRegex = new RegExp('[\\s\\S]{4}<span class="donations">[\\s\\S].*[\\s\\S]+?<\/span>');
  const newOptionPageHTML = optionPageHTML.replace(donationsRegex, '');

  // Save changes
  fse.writeFileSync(optionPage, newOptionPageHTML);
}

function safariBuild() {
  const files = [
    path.join('dist', 'img', 'donate.gif'),
    path.join('dist', 'img', 'patreon-small.png'),
    path.join('dist', 'img', 'patreon.png'),
  ];

  removeOptionPageDonations();
  removeFiles(files);
}

function writeJSONFile(file, object) {
  const content = JSON.stringify(object, null, 2);
  fse.writeFileSync(file, content);
}

let buildData;
main();
