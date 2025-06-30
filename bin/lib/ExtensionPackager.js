import ArchiveBuilder from './ArchiveBuilder.js';
import BuildUtils from './BuildUtils.js';

export default class ExtensionPackager {
  //#region Class reference helpers
  static get BuildUtils() {
    return BuildUtils;
  }
  get Class() {
    return this.constructor;
  }
  //#endregion

  constructor() {
    this.distDir = this.distDirectory;
    this.releaseDir = this.releaseDirectory;
    this.data = this.Class.BuildUtils.loadJSONFile(this.Class.BuildUtils.buildFilePath);
  }

  async buildArchive() {
    const builder = new ArchiveBuilder({
      sources: [this.distDir],
      outputDir: this.releaseDir,
      archiveName: `${this.packageName}.zip`,
      root: false,
    });
    return await builder.build();
  }

  get distDirectory() {
    return './dist';
  }

  errorMessage(label = 'ExtensionPackager') {
    return `❌ [${label}] Failed to create archive: ${this.packagePath}`;
  }

  get packageName() {
    return `${this.data.target}-mv${this.data.manifestVersion}-v${this.data.version}`;
  }

  get packagePath() {
    return `${this.releaseDir}/${this.packageName}.zip`;
  }

  get releaseDirectory() {
    return './release';
  }

  async run() {
    await this.buildArchive();
  }

  shouldPackage() {
    return this.data.release;
  }

  successMessage(label = 'ExtensionPackager') {
    return `📦 [${label}] Packed extension: ${this.packagePath}`;
  }
}
