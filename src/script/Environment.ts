import type WebConfig from '@APF/WebConfig';

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

type BaseTarget =
  | typeof Environment.BUILD_TARGET_BOOKMARKLET
  | typeof Environment.BUILD_TARGET_CHROME
  | typeof Environment.BUILD_TARGET_FIREFOX;

// open union: allows extra literal strings later (subclasses)
type AnyTarget = BaseTarget | (string & {});

interface BuildInfo {
  config: Partial<WebConfig>;
  manifestVersion: number;
  release: boolean;
  target: AnyTarget;
  version: string;
}

type UAData =
  | {
      brands?: Array<{ brand: string; version: string }>;
      mobile?: boolean;
      platform?: string;
    }
  | undefined;

// __BUILD__ is injected by webpack from ROOT/.build.json
/* eslint-disable-next-line @typescript-eslint/naming-convention */
declare const __BUILD__: BuildInfo | undefined;
const BUILD_DEFAULTS: BuildInfo = { config: {}, manifestVersion: 3, release: true, target: 'chrome', version: '1.0.0' };

export default class Environment {
  // Static constants
  static readonly BROWSER_CHROME = 'chrome' as const;
  static readonly BROWSER_EDGE = 'edge' as const;
  static readonly BROWSER_FIREFOX = 'firefox' as const;
  static readonly BROWSER_OPERA = 'opera' as const;
  static readonly BROWSER_SAFARI = 'safari' as const;
  static readonly BROWSER_UNKNOWN = 'unknown' as const;
  static readonly BUILD_TARGET_BOOKMARKLET = 'bookmarklet' as const;
  static readonly BUILD_TARGET_CHROME = 'chrome' as const;
  static readonly BUILD_TARGET_FIREFOX = 'firefox' as const;
  static readonly DEVICE_DESKTOP = 'desktop' as const;
  static readonly DEVICE_PHONE = 'phone' as const;
  static readonly DEVICE_TABLET = 'tablet' as const;
  static readonly OS_ANDROID = 'android' as const;
  static readonly OS_CHROMEOS = 'chromeos' as const;
  static readonly OS_IOS = 'ios' as const;
  static readonly OS_LINUX = 'linux' as const;
  static readonly OS_MACOS = 'macos' as const;
  static readonly OS_UNKNOWN = 'unknown' as const;
  static readonly OS_WINDOWS = 'windows' as const;

  // Static environment values - computed once and cached
  private static readonly _BUILD_INFO: Readonly<BuildInfo> = Object.freeze(
    typeof __BUILD__ === 'undefined' ? BUILD_DEFAULTS : __BUILD__,
  );
  private static readonly _BROWSER_INFO = Environment._computeBrowserInfoSafe();

  // Static getters for browser info
  static get browser(): BrowserInfo['browser'] {
    return this._BROWSER_INFO.browser;
  }
  static get os(): BrowserInfo['os'] {
    return this._BROWSER_INFO.os;
  }
  static get device(): BrowserInfo['device'] {
    return this._BROWSER_INFO.device;
  }

  // Static getters for build info
  static get buildTarget(): BuildInfo['target'] {
    return this._BUILD_INFO.target;
  }

  static get manifestVersion(): BuildInfo['manifestVersion'] {
    return this._BUILD_INFO.manifestVersion;
  }

  static get release(): BuildInfo['release'] {
    return this._BUILD_INFO.release;
  }

  static get version(): BuildInfo['version'] {
    return this._BUILD_INFO.version;
  }

  static get config(): BuildInfo['config'] {
    return this._BUILD_INFO.config;
  }

  // Browser target static helpers
  static get isChromeTarget() {
    return this.buildTarget === this.BUILD_TARGET_CHROME;
  }

  static get isFirefoxTarget() {
    return this.buildTarget === this.BUILD_TARGET_FIREFOX;
  }

  static get isBookmarkletTarget() {
    return this.buildTarget === this.BUILD_TARGET_BOOKMARKLET;
  }

  // Build environment static helpers
  static get isProduction() {
    return this.release;
  }

  static get isDevelopment() {
    return !this.isProduction;
  }

  // Device type static helpers
  static get isDesktop() {
    return this.device === this.DEVICE_DESKTOP;
  }

  static get isTablet() {
    return this.device === this.DEVICE_TABLET;
  }

  static get isPhone() {
    return this.device === this.DEVICE_PHONE;
  }

  static get isMobile() {
    return this.isTablet || this.isPhone;
  }

  // Browser static helpers
  static get isChrome() {
    return this.browser === this.BROWSER_CHROME;
  }

  static get isFirefox() {
    return this.browser === this.BROWSER_FIREFOX;
  }

  static get isSafari() {
    return this.browser === this.BROWSER_SAFARI;
  }

  static get isEdge() {
    return this.browser === this.BROWSER_EDGE;
  }

  static get isOpera() {
    return this.browser === this.BROWSER_OPERA;
  }

  // OS static helpers
  static get isWindows() {
    return this.os === this.OS_WINDOWS;
  }

  static get isMacOS() {
    return this.os === this.OS_MACOS;
  }

  static get isLinux() {
    return this.os === this.OS_LINUX;
  }

  static get isAndroid() {
    return this.os === this.OS_ANDROID;
  }

  static get isIOS() {
    return this.os === this.OS_IOS;
  }

  static get isChromeOS() {
    return this.os === this.OS_CHROMEOS;
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
    const uaData = (navigator as any).userAgentData as UAData;

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
    throw new Error('Environment is a static class and cannot be instantiated');
  }
}
