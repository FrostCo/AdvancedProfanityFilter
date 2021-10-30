/* eslint-disable no-console */
import fse from 'fs-extra';

const folders = ['./dist', './dist-lib', './test/built', './extension', './extension-chrome', './extension-firefox'];
folders.forEach((folder) => {
  console.log(`Cleaning ${folder}...`);
  fse.removeSync(folder);
});
