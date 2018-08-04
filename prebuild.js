'use strict';

// The is a workaround for Chrome extension content scripts not being able to reference other files.
// It will load all filter dependencies and remove any unsupported import/export statements, and then combine
// the contents into a single file: filter.bundle.ts. Once this is done you can run `tsc`.

const fs = require('fs');
const path = require('path');

var src = './src/';
var filterFiles = ['helper.ts', 'config.ts', 'domain.ts', 'word.ts', 'page.ts', 'filter.ts'];
var fileContents = [];

function writeCombinedFile(destination) {
  console.log('Writing combined file: ' + destination);
  fs.writeFile(destination, fileContents.join('\n'), function(err) {
    if (err) {
      console.log('ERROR: Failed to write file');
    }
  });
}

filterFiles.forEach(file => {
  console.log('Reading file: ' + file);
  var content;
  var cleanFile = [];
  var clean;
  var lines;
  content = fs.readFileSync(path.join(src,file), 'utf8');

  lines = content.split('\n');
  cleanFile.push('////\n//' + path.join(src, file) + '\n//');
  lines.forEach(line => {
    clean = line.replace(/^\s*export(\sdefault|)\s*/gi, '').replace(/^\s*import.*$/gi, '');
    if (clean != '') { cleanFile.push(clean); } // Remove empty lines
  });

  fileContents.push(cleanFile.join('\n'));
});

writeCombinedFile(path.join(src, 'filter.bundle.ts'));

// const { exec } = require('child_process');
// TODO: Async
// filterFiles.forEach(file => {
//   console.log('Reading file: ' + file);
//   fs.readFile(src + file, 'utf8', function(err, data){
//     var cleanFile = [];
//     var clean;
//     var lines;

//     lines = data.split('\n');
//     lines.forEach(line => {
//       clean = line.replace(/^\s*export(\sdefault|)\s*/gi, '').replace(/^\s*import.*$/gi, '');
//       if (clean != '') { cleanFile.push(clean); } // Remove empty lines
//     });

//     console.log('cleanFile: ' + cleanFile);
//     fileContents.push(cleanFile.join('\n'));
//   });
// });

// var out = './dist/filter.js'
// var params = '--target es6 --outFile ' + out + ' ' + filterFiles.map(file => src + 'tmp.' + file).join(' ') + ' ' + src + 'filter.ts';

// console.log('Executing: ', 'tsc', params);
// exec('tsc ' + params, (err, stdout, stderr) => {
//   if (err) {
//     // node couldn't execute the command
//     console.log(err);
//     return;
//   }

//   // the *entire* stdout and stderr (buffered)
//   console.log(`stdout: ${stdout}`);
//   console.log(`stderr: ${stderr}`);
// });

// filterFiles.forEach(file => fs.unlinkSync(src + 'tmp.' + file));