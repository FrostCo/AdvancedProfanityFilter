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

function handleManifestVersion() {
  console.log('Handling manfiest file');
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
  try {
    return JSON.parse(fse.readFileSync(file));
  } catch (err) {
    console.error(err.message);
    throw err;
  }
}

function writeJSONFile(file, object) {
  const content = JSON.stringify(object, null, 2);
  fse.writeFileSync(file, content);
}

function main() {
  try {
    // argv[0] = process (node)
    // argv[1] = script (this file)
    // argv[2] = first argument
    if (process.argv.length >= 2) {
      const args = process.argv.slice(2);
      common();
      switch (args[0]) {
        case '--apple':
          postbuildApple();
          break;
        default:
          postbuildDefault();
      }
    } else {
      usage();
    }
  } catch (error) {
    console.log(error);
    usage();
  }
}

function postbuildApple() {
  const files = [
    path.join('dist', 'img', 'donate.gif'),
    path.join('dist', 'img', 'patreon-small.png'),
    path.join('dist', 'img', 'patreon.png'),
  ];

  removeOptionPageDonations();
  removeFiles(files);
}

function postbuildDefault() {

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

function removeFiles(files) {
  if (typeof files === 'string') {
    files = [files];
  }

  files.forEach((file) => {
    console.log(`Removing ${file}`);
    fse.removeSync(file);
  });
}

function usage() {
  console.log(`usage:
      npm run postbuild
      npm run postbuild:apple
  `);
}

const buildData = loadJSONFile(buildDataPath);
main();
