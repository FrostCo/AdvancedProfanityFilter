/* eslint-disable no-console */
import fse from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';

function buildAll() {
  build(prepareZip());
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

function updateManifestFileInZip(zip, obj) {
  const content = JSON.stringify(obj, null, 2);
  zip.updateFile('manifest.json', Buffer.alloc(content.length, content));
}

const dist = './dist/';
const staticDir = './src/static/';
const manifestPath = path.join(staticDir, 'manifest.json');
buildAll();
