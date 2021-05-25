/* eslint-disable no-console */
import fse from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';
import { execSync } from 'child_process';

const scriptRegExp = new RegExp('\/script\/');
const staticRegExp = new RegExp('\/static\/');

function copyStatic(file) {
  const basename = path.basename(file);
  console.log('Copying static file: ', basename);
  fse.copySync(file, path.join('./dist/', basename));

  // Copy all static files
  // exec('npm run copy-static', function(err, stdout, stderr) {
  //   if (err) throw err;
  //   else console.log(stdout);
  // });
}

function compileScript(file) {
  const basename = path.basename(file);
  console.log('TypeScript file updated: ', basename);

  try {
    console.log('Building Typescript...');
    execSync('npm run build');
    console.log('done.');
  } catch(err) {
    console.log('Error: ', err);
  }
}

const watcher = chokidar.watch(
  [
    path.join(process.cwd() + '/src/**/*.ts'),
    path.join(process.cwd() + '/src/static/**/*.(css|html|json|)')
  ], {
    awaitWriteFinish: true,
    persistent: true
  }
);

const log = console.log.bind(console);
// watcher.on('add', filePath => log(`File ${filePath} has been added`))
// watcher.on('unlink', filePath => log(`File ${filePath} has been removed`));
watcher.on('ready', () => log('Initial scan complete. Watching for changes...\n\n'));

watcher.on('change', (filePath, stats) => {
  // console.log(filePath, stats);
  if (scriptRegExp.test(filePath)) { compileScript(filePath); }
  if (staticRegExp.test(filePath)) { copyStatic(filePath); }
});
