'use strict';

// The is a workaround for Chrome extension content scripts not being able to reference other files.
// It will load all filter dependencies and remove any unsupported import/export statements, and then combine
// the contents into a single file: filter.bundle.ts. Once this is done you can run `tsc`.

const fs = require('fs');
const path = require('path');

////
// Functions
function cleanFile(file) {
  let clean;
  let cleanLines = [];
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');

  // Ouptut header for file
  cleanLines.push('////\n//' + file + '\n//');

  // Clean lines
  lines.forEach(line => {
    clean = line.replace(/^\s*export(\sdefault|)\s*/gi, '').replace(/^\s*import.*$/gi, '');
    if (clean != '') { cleanLines.push(clean); } // Remove empty lines
  });

  return cleanLines.join('\n');
}

function findDependencies(file) {
  let imports = [];
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');

  lines.forEach(line => {
    if (/^\s*import\b/.test(line)) {
      let result = line.match(/'.+';?$/);
      let importFile;
      if (result) {
        importFile = result[0];
        // Remove semicolon & quotes, Remove relative path identifier, Change .js to .ts
        importFile = importFile.replace(/[;'"]/g, '').replace(/^\.\//, '').replace(/\.js/, '.ts');

        // Check for sub dependencies and include them as well
        let subDependencies = findDependencies(path.join(src, importFile));
        subDependencies.forEach(subDep => {
          console.log(' - Including subdepencies for ' + importFile + ': ' + subDependencies.join(', '));
          if (!imports.includes(subDep)) { imports.push(subDep); }
        });

        // Add dependency
        if (!imports.includes(importFile)) { imports.push(importFile); }
      } else { console.log('Problem with import line: ' + line); }
    }
  });

  return imports;
}

function writeBundleFile(destination, output) {
  let bundle = destination.replace('.ts', '.bundle.ts')
  console.log('Writing bundle: ' + bundle);
  fs.writeFile(bundle, output.join('\n'), function(err) {
    if (err) {
      console.log('ERROR: Failed to write file');
    }
  });
}

////
// Main task
function prebuild(files) {
  compileFiles.forEach(file => {
    console.log('Inspecting file: ' + file);
    let output = [];
    let dependencies = findDependencies(path.join(src,file));
    console.log('Dependencies for ' + file + ': ' + dependencies.join(', '));

    // Gather dependency file content
    dependencies.forEach(dependency => {
      output.push(cleanFile(path.join(src, dependency)));
    });

    // Append main file after all dependencies
    output.push(cleanFile(path.join(src, file)));

    writeBundleFile(path.join(src, file), output);
  });
}

////
// User variables
const src = './src/';
const compileFiles = ['filter.ts'];

prebuild(compileFiles);