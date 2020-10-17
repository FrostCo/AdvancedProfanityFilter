'use strict';

// eslint-disable-next-line
const fse = require('fs-extra');

// eslint-disable-next-line no-console
console.log('Copying static assets to ./dist folder...');
fse.copySync('./src/static', './dist');
fse.copySync('./src/img', './dist/img');
