/* eslint-disable no-console */
import fse from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';

function buildAll() {
  build(prepareZip());
  buildEdgeLegacy(getManifestJSON(), prepareZip());
  buildFirefox(getManifestJSON(), prepareZip());
  buildBookmarklet();
}

function build(zip, name = '') {
  if (name) { name = '-' + name; }
  const packagePath = `./extension${name}.zip`;
  console.log(`Building ${packagePath}`);
  fse.removeSync(packagePath);
  zip.writeZip(packagePath);
}

function buildBookmarklet() {
  fse.copyFileSync(path.join(dist, 'bookmarkletFilter.js'), './bookmarklet.js');
}

function buildEdgeLegacy(manifest, zip) {
  const packagePath = './extension-edge-legacy.zip';
  console.log(`Building ${packagePath}`);

  if (!fse.existsSync('./store/edge')) {
    console.log('Error! Missing Edge legacy polyfills.');
    return false;
  }

  const msPreload = {
    backgroundScript: 'backgroundScriptsAPIBridge.js',
    contentScript: 'contentScriptsAPIBridge.js'
  };

  // Fix options_page
  manifest.options_page = manifest.options_ui.page;
  delete manifest.options_ui;

  // Add ms-proload polyfills
  manifest['-ms-preload'] = msPreload;
  updateManifestFileInZip(zip, manifest);
  zip.addLocalFile('./store/edge/src/backgroundScriptsAPIBridge.js', null);
  zip.addLocalFile('./store/edge/src/contentScriptsAPIBridge.js', null);
  fse.removeSync(packagePath);
  zip.writeZip(packagePath);
}

function buildFirefox(manifest, zip) {
  const packagePath = './extension-firefox.zip';
  console.log(`Building ${packagePath}`);
  const firefoxManifest = {
    applications: {
      gecko: {
        id: '{853d1586-e2ab-4387-a7fd-1f7f894d2651}'
      }
    }
  };
  manifest.applications = firefoxManifest.applications;
  updateManifestFileInZip(zip, manifest);
  fse.removeSync(packagePath);
  zip.writeZip(packagePath);

  packageSource(); // Required due to bundled code
}

function getManifestJSON() {
  return JSON.parse(fse.readFileSync(manifestPath));
}

function packageSource() {
  fse.removeSync('./extension-source.zip');
  console.log('Building ./extension-source.zip');
  console.log('Build from source: npm install && npm run package');

  const sourceZip = new AdmZip();
  const files = [
    'LICENSE',
    'package.json',
    'package-lock.json',
    'README.md',
    'tsconfig.json'
  ];
  sourceZip.addLocalFolder('./bin', 'bin');
  sourceZip.addLocalFolder('./src', 'src');
  sourceZip.addLocalFolder('./test', 'test');
  files.forEach((file) => { sourceZip.addLocalFile(path.join('./', file), null); });
  sourceZip.writeZip('./extension-source.zip');
}

function prepareZip() {
  const zip = new AdmZip();
  zip.addLocalFolder(dist, null);
  return zip;
}

function updateManifestFile(file, obj) {
  const content = JSON.stringify(obj, null, 2);
  fse.writeFileSync(file, content);
}

function updateManifestFileInZip(zip, obj) {
  const content = JSON.stringify(obj, null, 2);
  zip.updateFile('manifest.json', Buffer.alloc(content.length, content));
}

function updateManifestVersion(manifest, newVersion) {
  console.log('Updating manifest.json version...');
  manifest.version = newVersion;
  updateManifestFile(manifestPath, manifest);
  fse.copyFileSync(manifestPath, path.join(dist, 'manifest.json'));
}

function updateOptionPageVersion(newVersion) {
  const filename = 'optionPage.html';
  const optionPage = path.join(staticDir, filename);
  const optionPageHTML = fse.readFileSync(optionPage).toString();
  let foundMatch = false;

  const newOptionPageHTML = optionPageHTML.replace(/id="helpVersion">.*?<\/a>/, function(match) {
    foundMatch = true;
    return `id="helpVersion">${newVersion}</a>`;
  });

  if (foundMatch) {
    console.log(`Updating ${filename} version...`);
    fse.writeFileSync(optionPage, newOptionPageHTML); // Update src version
    fse.copyFileSync(optionPage, path.join(dist, filename)); // Copy src to dist
  } else {
    throw `Failed to update ${optionPage}`;
  }
}

function updateVersions() {
  const manifest = getManifestJSON();
  if (manifest.version != process.env.npm_package_version) {
    const newVersion = process.env.npm_package_version;
    console.log('Version number is being updated: ' + manifest.version + ' -> ' + newVersion);
    updateManifestVersion(manifest, newVersion);
    updateOptionPageVersion(newVersion);
  }
}

const dist = './dist/';
const staticDir = './src/static/';
const manifestPath = path.join(staticDir, 'manifest.json');
updateVersions();
buildAll();
