const chokidar = require('chokidar');
const exec = require('child_process').exec
const path = require('path');

function copyStatic() {
  exec('npm run copy-static', function(err, stdout, stderr) {
    if (err) throw err;
    else console.log(stdout);
  });
}

function runBuild() {
  exec('npm run build', function(err, stdout, stderr) {
    if (err) throw err;
    else console.log(stdout);
  });
}

var watcher = chokidar.watch(
  [
    path.join(process.cwd() + '/src/**/*.ts'),
    path.join(process.cwd() + '/static/**/*.(css|html|json|)')
  ], {
  ignored: /.*\.bundle\.ts/,
  persistent: true
});

var log = console.log.bind(console);

watcher
.on('add', path => log(`File ${path} has been added`))
.on('unlink', path => log(`File ${path} has been removed`))
.on('ready', () => log('Initial scan complete. Ready for changes'));

watcher.on('change', (path, stats) => {
  if (path.match(/[\/\\]static[\/\\]/)) { copyStatic(); }
  if (path.match(/[\/\\]src[\/\\]/)) { runBuild(); }
});