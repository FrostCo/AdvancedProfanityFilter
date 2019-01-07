'use strict';

const fse = require('fs-extra');

console.log('Copying static assets to ./dist folder...');
fse.copySync('./src/static', './dist');
fse.copySync('./src/img', './dist/img');