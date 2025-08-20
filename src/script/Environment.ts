interface BrowserInfo {
  browser:
    | typeof Environment.BROWSER_CHROME
    | typeof Environment.BROWSER_SAFARI
    | typeof Environment.BROWSER_FIREFOX
    | typeof Environment.BROWSER_EDGE
    | typeof Environment.BROWSER_OPERA
    | typeof Environment.BROWSER_UNKNOWN;
  device: typeof Environment.DEVICE_DESKTOP | typeof Environment.DEVICE_TABLET | typeof Environment.DEVICE_PHONE;
  os:
    | typeof Environment.OS_ANDROID
    | typeof Environment.OS_CHROMEOS
    | typeof Environment.OS_IOS
    | typeof Environment.OS_LINUX
    | typeof Environment.OS_MACOS
    | typeof Environment.OS_UNKNOWN
    | typeof Environment.OS_WINDOWS;
}

interface BuildInfo {
  config: any;
  manifestVersion: number;
  release: boolean;
  target:
    | typeof Environment.BUILD_TARGET_BOOKMARKLET
    | typeof Environment.BUILD_TARGET_CHROME
    | typeof Environment.BUILD_TARGET_FIREFOX;
  version: string;
}

interface Navigator {
  userAgentData?: UserAgentData;
}

interface UserAgentData {
  brands?: Array<{ brand: string; version: string }>;
  mobile?: boolean;
  platform?: string;
}

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

  // Class reference helpers - can be overridden in children classes
  get Class() {
    return this.constructor as typeof Environment;
  }

  // Static constants
  static readonly BUILD_INFO = typeof __BUILD__ == 'undefined' ? BUILD_DEFAULTS : __BUILD__;
  static readonly BROWSER_CHROME = 'chrome';
  static readonly BROWSER_EDGE = 'edge';
  static readonly BROWSER_FIREFOX = 'firefox';
  static readonly BROWSER_OPERA = 'opera';
  static readonly BROWSER_SAFARI = 'safari';
  static readonly BROWSER_UNKNOWN = 'unknown';
  static readonly BUILD_TARGET_BOOKMARKLET = 'bookmarklet';
  static readonly BUILD_TARGET_CHROME = 'chrome';
  static readonly BUILD_TARGET_FIREFOX = 'firefox';
  static readonly DEVICE_DESKTOP = 'desktop';
  static readonly DEVICE_PHONE = 'phone';
  static readonly DEVICE_TABLET = 'tablet';
  static readonly OS_ANDROID = 'android';
  static readonly OS_CHROMEOS = 'chromeos';
  static readonly OS_IOS = 'ios';
  static readonly OS_LINUX = 'linux';
  static readonly OS_MACOS = 'macos';
  static readonly OS_UNKNOWN = 'unknown';
  static readonly OS_WINDOWS = 'windows';

  // Environment values
  private static readonly _BROWSER_INFO = Environment._computeBrowserInfoSafe();
  static readonly browser = Environment._BROWSER_INFO.browser;
  static readonly os = Environment._BROWSER_INFO.os;
  static readonly device = Environment._BROWSER_INFO.device;

  static get version() {
    return this.BUILD_INFO.version;
  }

  private static _computeBrowserInfoSafe(): BrowserInfo {
    const unknown: BrowserInfo = { browser: this.BROWSER_UNKNOWN, os: this.OS_UNKNOWN, device: this.DEVICE_DESKTOP };
    try {
      if (typeof navigator === 'undefined') {
        return unknown;
      }
      return this._computeBrowserInfo();
    } catch {
      return unknown;
    }
  }

  private static _computeBrowserInfo(): BrowserInfo {
    const ua = navigator.userAgent || '';
    const uaData = (navigator as Navigator).userAgentData;

    // iPadOS heuristic (handles Safari reporting MacIntel)
    const isiPadByPlatform = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const isiPadByUA = /\biPad\b/i.test(ua);
    const isiPadByCH = (uaData?.platform === 'macOS' || uaData?.platform === 'Mac OS') && navigator.maxTouchPoints > 1;
    const isiPadHeuristic = isiPadByPlatform || isiPadByUA || isiPadByCH;

    // OS detection
    let os: BrowserInfo['os'] = this.OS_UNKNOWN;
    if (/Windows/i.test(ua)) os = this.OS_WINDOWS;
    else if (/Android/i.test(ua)) os = this.OS_ANDROID;
    else if (/iPhone|iPod/i.test(ua)) os = this.OS_IOS;
    else if (isiPadHeuristic) os = this.OS_IOS;
    else if (/Mac/i.test(ua)) os = this.OS_MACOS;
    else if (/CrOS/i.test(ua)) os = this.OS_CHROMEOS;
    else if (/Linux/i.test(ua)) os = this.OS_LINUX;

    // Browser detection (filter "Not/A Brand")
    const brands = (uaData?.brands ?? []).map((b) => b.brand.toLowerCase()).filter((b) => !/not.?a.?brand/i.test(b));
    const hasBrand = (name: string) => brands.some((b) => b.includes(name));

    let browser: BrowserInfo['browser'] = this.BROWSER_UNKNOWN;
    if (hasBrand('edge') || /Edg(?:e|A|iOS)?\//i.test(ua)) {
      browser = this.BROWSER_EDGE;
    } else if (hasBrand('opera') || /OPR\/|Opera/i.test(ua)) {
      browser = this.BROWSER_OPERA;
    } else if (hasBrand('chrome') || /Chrome\/|CriOS\//i.test(ua)) {
      if (!/OPR\/|Edg(?:e|A|iOS)?\//i.test(ua)) browser = this.BROWSER_CHROME;
    } else if (/FxiOS\/|Firefox\//i.test(ua)) {
      browser = this.BROWSER_FIREFOX;
    } else if (hasBrand('safari') || (/Safari\//i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR/i.test(ua))) {
      browser = this.BROWSER_SAFARI;
    }

    // Device type
    const chMobile = uaData?.mobile;
    const isTouch =
      (typeof matchMedia === 'function' &&
        (() => {
          try {
            return matchMedia('(pointer: coarse)').matches;
          } catch {
            return false;
          }
        })()) ||
      (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1);

    const viewportShortSide =
      typeof window !== 'undefined' ? Math.min(window.innerWidth || 0, window.innerHeight || 0) : 0;

    let device: BrowserInfo['device'] = this.DEVICE_DESKTOP;

    if (os === this.OS_IOS) {
      device = isiPadHeuristic ? this.DEVICE_TABLET : this.DEVICE_PHONE;
    } else if (os === this.OS_ANDROID) {
      const uaHasMobile = /\bMobile\b/i.test(ua);
      const uaHasTabletWord = /\bTablet\b|\bPad\b/i.test(ua);
      const androidIsTablet = uaHasTabletWord || !uaHasMobile;

      if (chMobile === false) {
        device = this.DEVICE_TABLET; // UA-CH says "not mobile" → treat as tablet
      } else {
        device = androidIsTablet ? this.DEVICE_TABLET : this.DEVICE_PHONE;
      }
    } else {
      // Non–Android/iOS: prefer desktop; use touch + viewport as a hint
      if (isTouch) {
        if (viewportShortSide > 0 && viewportShortSide < 600) {
          device = this.DEVICE_PHONE;
        } else if (viewportShortSide >= 600) {
          device = this.DEVICE_TABLET;
        } else {
          device = this.DEVICE_DESKTOP;
        }
      } else {
        device = this.DEVICE_DESKTOP;
      }
    }

    return { browser, os, device };
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
