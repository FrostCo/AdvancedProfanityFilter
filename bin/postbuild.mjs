/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-console */
import fse from 'fs-extra';
import path from 'path';
import {
  buildFilePath,
  distManifestPath,
  loadJSONFile,
  releaseFilePath,
  removeFiles,
  srcManifestPath,
  writeJSONFile
} from './lib.mjs';

let buildData;

function common() {
  handleManifestVersion();
  handleVersion();
}

function firefoxBuild() {
  const manifest = loadJSONFile(distManifestPath);
  manifest.applications = {
    gecko: {
      id: '{853d1586-e2ab-4387-a7fd-1f7f894d2651}'
    }
  };
  manifest.background.persistent = true; // Event pages are not currently supported.
  writeJSONFile(distManifestPath, manifest);
}

function handleManifestVersion() {
  if (buildData.manifestVersion == 2) {
    const manifest = loadJSONFile(distManifestPath);
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
    manifest.web_accessible_resources = ['audio/*.mp3'];
    writeJSONFile(distManifestPath, manifest);
  }
}

function handleVersion() {
  const manifest = loadJSONFile(distManifestPath);

  if (manifest.version != buildData.version) {
    console.log(`Updating manifest.json version (${manifest.version} -> ${buildData.version})`);
    manifest.version = buildData.version;
    writeJSONFile(distManifestPath, manifest);

    // Update source manfiest.json
    const srcManifest = loadJSONFile(srcManifestPath);
    srcManifest.version = buildData.version;
    writeJSONFile(srcManifestPath, srcManifest);
  }
}

function main() {
  // Load .release.json if present, otherwise load .build.json
  if (fse.existsSync(releaseFilePath)) {
    buildData = loadJSONFile(releaseFilePath);
  } else {
    buildData = loadJSONFile(buildFilePath);
  }

  // Perform postbuild actions
  common();

  if (buildData.target == 'firefox') {
    firefoxBuild();
  }

  if (buildData.target == 'safari') {
    safariBuild();
  }
}

function removeOptionPageBookmarklet() {
  console.log("Removing Bookmarklet tab from Option's page");
  const optionPage = path.join('dist', 'optionPage.html');
  const optionPageHTML = fse.readFileSync(optionPage).toString();

  // Remove div#menu a[href='#/bookmarklet']
  // const donationsRegex = new RegExp();
  const newOptionPageHTML = optionPageHTML.replace('  <a href="#/bookmarklet" class="w3-bar-item w3-button">Bookmarklet</a>', '');

  // Save changes
  fse.writeFileSync(optionPage, newOptionPageHTML);
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

  removeOptionPageBookmarklet();
  removeOptionPageDonations();
  removeFiles(files);
}

main();
