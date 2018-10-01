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

function copyTypeScript(file) {
  let basename = path.basename(file);
  console.log('TypeScript file updated: ', basename)

  try {
    if (tsBundleFiles.includes(basename)) {
      console.log('Prebuild Typescript...');
      execSync('node ./tools/prebuild.js');
    }

    console.log('Running TypeScript...');
    execSync('tsc');
    console.log('Done.');
  } catch(err) {
    console.log('Error: ', err);
  }
}

const tsBundleFiles = ['webFilter.ts', 'helper.ts', 'domain.ts', 'word.ts', 'filter.ts', 'page.ts', 'config.ts', 'webConfig.ts'];
var watcher = chokidar.watch(
  [
    path.join(process.cwd() + '/src/**/*.ts'),
    path.join(process.cwd() + '/static/**/*.(css|html|json|)')
  ], {
    ignored: /.*\.bundle\.ts/,
    awaitWriteFinish: true,
    persistent: true
  }
);

var log = console.log.bind(console);
// watcher.on('add', filePath => log(`File ${filePath} has been added`))
// watcher.on('unlink', filePath => log(`File ${filePath} has been removed`));
watcher.on('ready', () => log('Initial scan complete. Ready for changes\n\n'));

watcher.on('change', (filePath, stats) => {
  // console.log(filePath, stats);
  if (filePath.match(/[\/\\]static[\/\\]/)) { copyStatic(filePath); }
  if (filePath.match(/[\/\\]src[\/\\]/)) { copyTypeScript(filePath); }
});