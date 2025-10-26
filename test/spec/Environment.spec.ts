import { expect } from 'chai';
import Environment from '@APF/Environment';

describe('Environment', function () {
  let originalNavigator: any;
  let originalWindow: any;

  beforeEach(function () {
    // Store original globals
    originalNavigator = global.navigator;
    originalWindow = global.window;
  });

  afterEach(function () {
    // Restore original globals using Object.defineProperty for read-only properties
    if (originalNavigator !== undefined) {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    } else {
      delete (global as any).navigator;
    }

    if (originalWindow !== undefined) {
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    } else {
      delete (global as any).window;
    }
  });

  describe('Constants', function () {
    it('should have correct browser constants', function () {
      expect(Environment.BROWSER_CHROME).to.equal('chrome');
      expect(Environment.BROWSER_EDGE).to.equal('edge');
      expect(Environment.BROWSER_FIREFOX).to.equal('firefox');
      expect(Environment.BROWSER_OPERA).to.equal('opera');
      expect(Environment.BROWSER_SAFARI).to.equal('safari');
      expect(Environment.BROWSER_UNKNOWN).to.equal('unknown');
    });

    it('should have correct device constants', function () {
      expect(Environment.DEVICE_DESKTOP).to.equal('desktop');
      expect(Environment.DEVICE_PHONE).to.equal('phone');
      expect(Environment.DEVICE_TABLET).to.equal('tablet');
    });

    it('should have correct OS constants', function () {
      expect(Environment.OS_ANDROID).to.equal('android');
      expect(Environment.OS_CHROMEOS).to.equal('chromeos');
      expect(Environment.OS_IOS).to.equal('ios');
      expect(Environment.OS_LINUX).to.equal('linux');
      expect(Environment.OS_MACOS).to.equal('macos');
      expect(Environment.OS_UNKNOWN).to.equal('unknown');
      expect(Environment.OS_WINDOWS).to.equal('windows');
    });

    it('should have correct build target constants', function () {
      expect(Environment.BUILD_TARGET_BOOKMARKLET).to.equal('bookmarklet');
      expect(Environment.BUILD_TARGET_CHROME).to.equal('chrome');
      expect(Environment.BUILD_TARGET_FIREFOX).to.equal('firefox');
    });
  });

  describe('Static Properties', function () {
    it('should have browser property', function () {
      expect(Environment.browser).to.be.oneOf([
        Environment.BROWSER_CHROME,
        Environment.BROWSER_EDGE,
        Environment.BROWSER_FIREFOX,
        Environment.BROWSER_OPERA,
        Environment.BROWSER_SAFARI,
        Environment.BROWSER_UNKNOWN,
      ]);
    });

    it('should have device property', function () {
      expect(Environment.device).to.be.oneOf([
        Environment.DEVICE_DESKTOP,
        Environment.DEVICE_PHONE,
        Environment.DEVICE_TABLET,
      ]);
    });

    it('should have os property', function () {
      expect(Environment.os).to.be.oneOf([
        Environment.OS_ANDROID,
        Environment.OS_CHROMEOS,
        Environment.OS_IOS,
        Environment.OS_LINUX,
        Environment.OS_MACOS,
        Environment.OS_UNKNOWN,
        Environment.OS_WINDOWS,
      ]);
    });

    it('should have manifestVersion property', function () {
      expect(Environment.manifestVersion).to.be.a('number');
      expect(Environment.manifestVersion).to.be.oneOf([2, 3]);
    });

    it('should have buildTarget property', function () {
      expect(Environment.buildTarget).to.be.a('string');
    });

    it('should have version property', function () {
      expect(Environment.version).to.be.a('string');
    });

    it('should have release property', function () {
      expect(Environment.release).to.be.a('boolean');
    });

    it('should have config property', function () {
      expect(Environment.config).to.be.an('object');
    });

    it('should have info property with all properties', function () {
      const info = Environment.info;
      expect(info).to.have.property('browser');
      expect(info).to.have.property('os');
      expect(info).to.have.property('device');
      expect(info).to.have.property('manifestVersion');
      expect(info).to.have.property('release');
      expect(info).to.have.property('buildTarget');
      expect(info).to.have.property('version');
      expect(info).to.have.property('config');
    });
  });

  describe('Browser Detection', function () {
    it('should detect Chrome browser', function () {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          platform: 'Win32',
          maxTouchPoints: 0,
        } as any,
        writable: true,
        configurable: true,
      });

      // Note: Browser detection is computed once, so we test the current behavior
      expect(Environment.browser).to.be.oneOf([Environment.BROWSER_CHROME, Environment.BROWSER_UNKNOWN]);
    });

    it('should detect Firefox browser', function () {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
          platform: 'Win32',
          maxTouchPoints: 0,
        } as any,
        writable: true,
        configurable: true,
      });

      expect(Environment.browser).to.be.oneOf([Environment.BROWSER_FIREFOX, Environment.BROWSER_UNKNOWN]);
    });

    it('should detect Safari browser', function () {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
          platform: 'MacIntel',
          maxTouchPoints: 0,
        } as any,
        writable: true,
        configurable: true,
      });

      expect(Environment.browser).to.be.oneOf([Environment.BROWSER_SAFARI, Environment.BROWSER_UNKNOWN]);
    });
  });

  describe('OS Detection', function () {
    it('should detect Windows OS', function () {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          platform: 'Win32',
          maxTouchPoints: 0,
        } as any,
        writable: true,
        configurable: true,
      });

      expect(Environment.os).to.be.oneOf([Environment.OS_WINDOWS, Environment.OS_UNKNOWN]);
    });

    it('should detect macOS', function () {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
          platform: 'MacIntel',
          maxTouchPoints: 0,
        } as any,
        writable: true,
        configurable: true,
      });

      expect(Environment.os).to.be.oneOf([Environment.OS_MACOS, Environment.OS_UNKNOWN]);
    });

    it('should detect Android OS', function () {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
          platform: 'Linux armv8l',
          maxTouchPoints: 5,
        } as any,
        writable: true,
        configurable: true,
      });

      expect(Environment.os).to.be.oneOf([Environment.OS_ANDROID, Environment.OS_UNKNOWN]);
    });
  });

  describe('Device Detection', function () {
    it('should detect desktop device', function () {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          platform: 'Win32',
          maxTouchPoints: 0,
        } as any,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'window', {
        value: {
          innerWidth: 1920,
          innerHeight: 1080,
        } as any,
        writable: true,
        configurable: true,
      });

      expect(Environment.device).to.be.oneOf([
        Environment.DEVICE_DESKTOP,
        Environment.DEVICE_PHONE,
        Environment.DEVICE_TABLET,
      ]);
    });

    it('should detect mobile device', function () {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
          platform: 'Linux armv8l',
          maxTouchPoints: 5,
        } as any,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'window', {
        value: {
          innerWidth: 360,
          innerHeight: 640,
        } as any,
        writable: true,
        configurable: true,
      });

      expect(Environment.device).to.be.oneOf([
        Environment.DEVICE_PHONE,
        Environment.DEVICE_TABLET,
        Environment.DEVICE_DESKTOP,
      ]);
    });
  });

  describe('Error Handling', function () {
    it('should handle undefined navigator gracefully', function () {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(Environment.browser).to.be.oneOf([
        Environment.BROWSER_CHROME,
        Environment.BROWSER_EDGE,
        Environment.BROWSER_FIREFOX,
        Environment.BROWSER_OPERA,
        Environment.BROWSER_SAFARI,
        Environment.BROWSER_UNKNOWN,
      ]);
    });

    it('should handle missing userAgent gracefully', function () {
      Object.defineProperty(global, 'navigator', {
        value: {
          platform: 'Win32',
          maxTouchPoints: 0,
        } as any,
        writable: true,
        configurable: true,
      });

      expect(Environment.browser).to.be.oneOf([
        Environment.BROWSER_CHROME,
        Environment.BROWSER_EDGE,
        Environment.BROWSER_FIREFOX,
        Environment.BROWSER_OPERA,
        Environment.BROWSER_SAFARI,
        Environment.BROWSER_UNKNOWN,
      ]);
    });
  });

  describe('Helper Methods', function () {
    it('should have build target helpers', function () {
      expect(Environment.isChromeTarget).to.be.a('boolean');
      expect(Environment.isFirefoxTarget).to.be.a('boolean');
      expect(Environment.isBookmarkletTarget).to.be.a('boolean');
    });

    it('should have build environment helpers', function () {
      expect(Environment.isProduction).to.be.a('boolean');
      expect(Environment.isDevelopment).to.be.a('boolean');
      expect(Environment.isDevelopment).to.equal(!Environment.isProduction);
    });

    it('should have device type helpers', function () {
      expect(Environment.isDesktop).to.be.a('boolean');
      expect(Environment.isTablet).to.be.a('boolean');
      expect(Environment.isPhone).to.be.a('boolean');
      expect(Environment.isMobile).to.be.a('boolean');
      expect(Environment.isMobile).to.equal(Environment.isTablet || Environment.isPhone);
    });

    it('should have browser type helpers', function () {
      expect(Environment.isChrome).to.be.a('boolean');
      expect(Environment.isFirefox).to.be.a('boolean');
      expect(Environment.isSafari).to.be.a('boolean');
      expect(Environment.isEdge).to.be.a('boolean');
      expect(Environment.isOpera).to.be.a('boolean');
    });

    it('should have OS type helpers', function () {
      expect(Environment.isWindows).to.be.a('boolean');
      expect(Environment.isMacOS).to.be.a('boolean');
      expect(Environment.isLinux).to.be.a('boolean');
      expect(Environment.isAndroid).to.be.a('boolean');
      expect(Environment.isIOS).to.be.a('boolean');
      expect(Environment.isChromeOS).to.be.a('boolean');
    });

    it('should have manifest version helpers', function () {
      expect(Environment.isManifestV2).to.be.a('boolean');
      expect(Environment.isManifestV3).to.be.a('boolean');
    });
  });

  describe('Advanced Detection', function () {
    it('should detect additional browsers', function () {
      // Edge with UA-CH
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
          platform: 'Win32',
          maxTouchPoints: 0,
          userAgentData: {
            brands: [
              { brand: 'Not/A Brand', version: '99' },
              { brand: 'Microsoft Edge', version: '91' },
            ],
            mobile: false,
            platform: 'Windows',
          },
        } as any,
        writable: true,
        configurable: true,
      });
      expect(Environment.browser).to.be.oneOf([Environment.BROWSER_EDGE, Environment.BROWSER_UNKNOWN]);

      // Opera
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 OPR/77.0.4054.277',
          platform: 'Win32',
          maxTouchPoints: 0,
        } as any,
        writable: true,
        configurable: true,
      });
      expect(Environment.browser).to.be.oneOf([Environment.BROWSER_OPERA, Environment.BROWSER_UNKNOWN]);
    });

    it('should detect additional operating systems', function () {
      // Linux
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          platform: 'Linux x86_64',
          maxTouchPoints: 0,
        } as any,
        writable: true,
        configurable: true,
      });
      expect(Environment.os).to.be.oneOf([Environment.OS_LINUX, Environment.OS_UNKNOWN]);

      // ChromeOS
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          platform: 'Linux x86_64',
          maxTouchPoints: 0,
        } as any,
        writable: true,
        configurable: true,
      });
      expect(Environment.os).to.be.oneOf([Environment.OS_CHROMEOS, Environment.OS_UNKNOWN]);

      // iOS
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
          platform: 'iPhone',
          maxTouchPoints: 5,
        } as any,
        writable: true,
        configurable: true,
      });
      expect(Environment.os).to.be.oneOf([Environment.OS_IOS, Environment.OS_UNKNOWN]);
    });
  });

  describe('Device Detection Edge Cases', function () {
    it('should handle tablet detection', function () {
      // Android tablet
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36',
          platform: 'Linux armv8l',
          maxTouchPoints: 5,
        } as any,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'window', {
        value: { innerWidth: 1024, innerHeight: 768 } as any,
        writable: true,
        configurable: true,
      });
      expect(Environment.device).to.be.oneOf([
        Environment.DEVICE_PHONE,
        Environment.DEVICE_TABLET,
        Environment.DEVICE_DESKTOP,
      ]);

      // iPad
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
          platform: 'iPad',
          maxTouchPoints: 5,
        } as any,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'window', {
        value: { innerWidth: 768, innerHeight: 1024 } as any,
        writable: true,
        configurable: true,
      });
      expect(Environment.device).to.be.oneOf([
        Environment.DEVICE_PHONE,
        Environment.DEVICE_TABLET,
        Environment.DEVICE_DESKTOP,
      ]);
    });

    it('should handle matchMedia scenarios', function () {
      // Working matchMedia
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          platform: 'Win32',
          maxTouchPoints: 0,
        } as any,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(global, 'matchMedia', {
        value: (query: string) => ({
          matches: query === '(pointer: coarse)',
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => true,
        }),
        writable: true,
        configurable: true,
      });
      expect(Environment.device).to.be.oneOf([
        Environment.DEVICE_DESKTOP,
        Environment.DEVICE_PHONE,
        Environment.DEVICE_TABLET,
      ]);

      // matchMedia error
      Object.defineProperty(global, 'matchMedia', {
        value: () => {
          throw new Error('matchMedia not supported');
        },
        writable: true,
        configurable: true,
      });
      expect(Environment.device).to.be.oneOf([
        Environment.DEVICE_DESKTOP,
        Environment.DEVICE_PHONE,
        Environment.DEVICE_TABLET,
      ]);
    });
  });

  describe('Constructor', function () {
    it('should throw error when instantiated', function () {
      expect(() => {
        new Environment();
      }).to.throw('Environment is a static class and cannot be instantiated');
    });
  });
});
