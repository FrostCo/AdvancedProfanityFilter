import fse from 'fs-extra';
import path from 'path';

// Paths are relative from the project root
// Should be correct when running with `npm run ...`
export const buildFilePath = path.join('.build.json');
export const distManifestPath = path.join('dist', 'manifest.json');
export const releaseFilePath = path.join('.release.json');
export const srcManifestPath = path.join('src', 'static', 'manifest.json');

export function loadJSONFile(file) {
  return JSON.parse(fse.readFileSync(file));
}

export function removeFiles(files, silent = false) {
  if (typeof files === 'string') {
    files = [files];
  }

  files.forEach((file) => {
    if (!silent) {
      // eslint-disable-next-line no-console
      console.log(`Removing ${file}`);
    }
    fse.removeSync(file);
  });
}

export function writeJSONFile(file, object) {
  const content = JSON.stringify(object, null, 2);
  fse.writeFileSync(file, content);
}
