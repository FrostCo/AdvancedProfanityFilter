import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';

export default class ArchiveBuilder {
  /**
   * @param {Object} options
   * @param {string[]} options.sources - Paths to files or directories to include in the zip.
   * @param {string} options.outputDir - Where to write the zip file.
   * @param {string} options.archiveName - Name of the zip file (e.g., 'extension.zip').
   * @param {string|false} [options.root] - Optional root folder name in the archive, or false to flatten.
   */
  constructor({ sources, outputDir, archiveName, root = undefined }) {
    this.sources = sources;
    this.outputDir = outputDir;
    this.archiveName = archiveName;
    this.root = root; // e.g., 'dist' or false
  }

  get archivePath() {
    return path.join(this.outputDir, this.archiveName);
  }

  async build() {
    await fs.ensureDir(this.outputDir);

    const output = fs.createWriteStream(this.archivePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve());
      archive.on('error', reject);

      archive.pipe(output);

      for (const src of this.sources) {
        const stats = fs.statSync(src);

        if (stats.isDirectory()) {
          const dest = this.root === undefined ? path.basename(src) : this.root;
          archive.directory(src, this.root === false ? false : dest);
        } else {
          const base = path.basename(src);
          const dest = this.root === undefined ? base : this.root === false ? base : path.join(this.root, base);

          archive.file(src, { name: dest });
        }
      }

      archive.finalize();
    });
  }
}
