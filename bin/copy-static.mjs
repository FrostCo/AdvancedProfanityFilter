/* eslint-disable no-console */
import fse from 'fs-extra';

console.log('Copying static assets to ./dist folder...');
fse.copySync('./src/static', './dist');
fse.copySync('./src/audio', './dist/audio');
fse.copySync('./src/img', './dist/img');
