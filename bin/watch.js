'use strict';

const chokidar = require('chokidar');
const execSync = require('child_process').execSync;
const path = require('path');
const fse = require('fs-extra');

function copyStatic(file) {
  let basename = path.basename(file);
  console.log('Copying static file: ', basename);
  fse.copySync(file, path.join('./dist/', basename));

  // Copy all static files
  // exec('npm run copy-static', function(err, stdout, stderr) {
  //   if (err) throw err;
  //   else console.log(stdout);
  // });
}

function compileScript(file) {
  let basename = path.basename(file);
  console.log('TypeScript file updated: ', basename)

  try {
    console.log('Building Typescript...');
    execSync('npm run build');
  } catch(err) {
    console.log('Error: ', err);
  }
}

let watcher = chokidar.watch(
  [
    path.join(process.cwd() + '/src/**/*.ts'),
    path.join(process.cwd() + '/src/static/**/*.(css|html|json|)')
  ], {
    awaitWriteFinish: true,
    persistent: true
  }
);

let log = console.log.bind(console);
// watcher.on('add', filePath => log(`File ${filePath} has been added`))
// watcher.on('unlink', filePath => log(`File ${filePath} has been removed`));
watcher.on('ready', () => log('Initial scan complete. Watching for changes...\n\n'));

watcher.on('change', (filePath, stats) => {
  // console.log(filePath, stats);
  if (filePath.match(/[\/\\]static[\/\\]/)) { copyStatic(filePath); }
  if (filePath.match(/[\/\\]script[\/\\]/)) { compileScript(filePath); }
});