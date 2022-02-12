/* eslint-disable no-console */
import Path from 'path';
import AdmZip from 'adm-zip';
import { removeFiles } from './lib.mjs';

// Required for Firefox due to bundled code
function packageSource() {
  removeFiles('./extension-source.zip');
  console.log('Building ./extension-source.zip');
  console.log('Build from source: npm install && npm run package:bookmarklet && npm run package:firefox');
  console.log('  Unpacked: ./dist');
  console.log('  Packed: ./extension-firefox.zip');

  const sourceZip = new AdmZip();
  const files = [
    '.build.json',
    'LICENSE',
    'package-lock.json',
    'package.json',
    'README.md',
    'tsconfig.json',
  ];
  sourceZip.addLocalFolder('./bin', 'bin');
  sourceZip.deleteFile(Path.join('bin', 'git-filters/'));
  sourceZip.addLocalFolder('./src', 'src');
  files.forEach((file) => { sourceZip.addLocalFile(file, null); });
  sourceZip.writeZip('./extension-source.zip');
}

packageSource();
