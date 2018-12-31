'use strict';

const fse = require('fs-extra');

let folders = ['./built', './dist', './extension-chrome', './extension-firefox']

folders.forEach((folder) => { console.log(`Cleaning ${folder}...`); fse.removeSync(folder); });