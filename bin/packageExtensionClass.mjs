/* eslint-disable no-console */
import AdmZip from 'adm-zip';
import { globbySync } from 'globby';
import { buildFilePath, loadJSONFile, removeFiles } from './common.mjs';
import fse from 'fs-extra';

export default class PackageExtension {
  constructor() {
    this.distDir = this.distDirectory;
    this.releaseDir = this.releaseDirectory;

    try {
      fse.ensureDirSync(this.releaseDir);
      this.data = loadJSONFile(buildFilePath);
    } catch (err) {
      console.error(err.message);
      throw (err);
    }
  }

  buildArchive() {
    this.zip = new AdmZip();
    this.zip.addLocalFolder(this.distDir, null);

    // Remove unwanted files
    const filesToRemove = globbySync(['dist/**/*.LICENSE.txt']);
    for (const file of filesToRemove) {
      const entry = file.replace(/^dist\//, '');
      this.zip.deleteFile(entry);
    }
  }

  get distDirectory() {
    return './dist';
  }

  get packagePath() {
    return `${this.releaseDir}/${this.zipName}.zip`;
  }

  get releaseDirectory() {
    return './release';
  }

  run() {
    try {
      this.buildArchive();
      removeFiles(this.packagePath, true);
      console.log(`Building ${this.packagePath}`);
      this.zip.writeZip(this.packagePath);
    } catch (err) {
      console.error(err.message);
      throw (err);
    }
  }

  get zipName() {
    return `${this.data.target}-mv${this.data.manifestVersion}-v${this.data.version}`;
  }
}
