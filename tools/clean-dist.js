'use strict';

const fse = require('fs-extra');

console.log('Cleaning ./dist folder...');
fse.emptyDirSync('./dist');