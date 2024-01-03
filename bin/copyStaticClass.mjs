/* eslint-disable no-console */
import fse from 'fs-extra';

export default class CopyStatic {
  run() {
    console.log('Copying static assets to ./dist folder...');
    fse.copySync('./src/static', './dist');
    fse.copySync('./src/img', './dist/img');
  }
}
