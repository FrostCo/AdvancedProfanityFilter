// __BUILD__ is injected by webpack from ROOT/.build.json
/* eslint-disable-next-line @typescript-eslint/naming-convention */
declare const __BUILD__: BuildInfo;
const BUILD_DEFAULTS: BuildInfo = { config: {}, manifestVersion: 3, release: true, target: 'chrome', version: '1.0.0' };

export default class Environment {
  buildTarget: string;
  manifestVersion: number;
  release: boolean;
  version: string;
  _buildInfo: BuildInfo;

  static readonly BUILD_INFO = typeof __BUILD__ == 'undefined' ? BUILD_DEFAULTS : __BUILD__;
  static readonly BUILD_TARGET_BOOKMARKLET = 'bookmarklet';
  static readonly BUILD_TARGET_CHROME = 'chrome';
  static readonly BUILD_TARGET_FIREFOX = 'firefox';

  static get version() {
    return this.BUILD_INFO.version;
  }

  // Class reference helpers - can be overridden in children classes
  get Class() {
    return this.constructor as typeof Environment;
  }

  constructor() {
    this._buildInfo = this.Class.BUILD_INFO;
    this.buildTarget = this.Class.BUILD_INFO.target;
    this.manifestVersion = this.Class.BUILD_INFO.manifestVersion;
    this.release = this.Class.BUILD_INFO.release;
    this.version = this.Class.BUILD_INFO.version;
  }

  // Browser targets
  get isChromeTarget(): boolean {
    return this.buildTarget === this.Class.BUILD_TARGET_CHROME;
  }

  get isFirefoxTarget(): boolean {
    return this.buildTarget === this.Class.BUILD_TARGET_FIREFOX;
  }

  get isBookmarkletTarget(): boolean {
    return this.buildTarget === this.Class.BUILD_TARGET_BOOKMARKLET;
  }

  // Builds
  get isProduction(): boolean {
    return this.release;
  }

  get isDevelopment(): boolean {
    return !this.isProduction;
  }
}
