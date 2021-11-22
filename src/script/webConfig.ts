import Constants from './lib/constants';
import Config from './lib/config';
import Logger from './lib/logger';
const logger = new Logger();

export default class WebConfig extends Config {
  _lastSplitKeys: { [key: string]: number };
  audioWordlistId: number;
  collectStats: boolean;
  customAudioSites: { [site: string]: AudioRule[] };
  darkMode: boolean;
  domains: { [site: string]: DomainCfg };
  enabledDomainsOnly: boolean;
  fillerAudio: string;
  muteAudio: boolean;
  muteAudioOnly: boolean;
  muteCueRequireShowing: boolean;
  muteMethod: number;
  password: string;
  showSubtitles: number;
  showUpdateNotification: boolean;
  syncLargeKeys: boolean;
  youTubeAutoSubsMax: number;
  youTubeAutoSubsMin: number;

  static readonly _classDefaults = {
    audioWordlistId: 0,
    collectStats: true,
    customAudioSites: null,
    darkMode: false,
    domains: {},
    enabledDomainsOnly: false,
    fillerAudio: '',
    muteAudio: false,
    muteAudioOnly: false,
    muteCueRequireShowing: false,
    muteMethod: Constants.MUTE_METHODS.TAB,
    password: null,
    showSubtitles: Constants.SHOW_SUBTITLES.ALL,
    showUpdateNotification: false,
    syncLargeKeys: true,
    youTubeAutoSubsMax: 0,
    youTubeAutoSubsMin: 0,
  };

  // eslint-disable-next-line @typescript-eslint/naming-convention
  static readonly QUOTA_BYTES_PER_ITEM = 8192; // https://developer.chrome.com/apps/storage chrome.storage.sync.QUOTA_BYTES_PER_ITEM
  static readonly _defaults = Object.assign({}, Config._defaults, WebConfig._classDefaults);
  static readonly _maxBytes = 8000;
  static readonly _maxSplitKeys = 64;
  static readonly _splittingKeys = ['domains', 'words'];

  static chromeStorageAvailable(): boolean {
    return !!(chrome && chrome.storage && chrome.storage.sync && chrome.storage.local);
  }

  // Combine all ._[prop]* into .[prop]
  static combineData(data, prop: string): string[] {
    data[prop] = {};
    if (data[`_${prop}0`] !== undefined) {
      const dataKeys = WebConfig.getDataContainerKeys(data, prop);

      // Add all _[prop]* to .[prop] and remove _[prop]*
      dataKeys.forEach((key) => {
        Object.assign(data[prop], data[key]);
        delete data[key];
      });
      return dataKeys;
    }
  }

  // Find all _[prop]* to combine
  static getDataContainerKeys(data, prop) {
    const pattern = new RegExp(`^_${prop}\\d+`);
    const containerKeys = Object.keys(data).filter((key) => pattern.test(key));
    return containerKeys.sort();
  }

  static getLocalStorage(keys: string | string[] | Record<string, unknown>) {
    if (typeof keys === 'string') { keys = [keys]; }

    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (data) => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError.message)
          : resolve(data);
      });
    });
  }

  static getMaxSplitKeyFromArray(splitKeys: string[] = []): number {
    if (Array.isArray(splitKeys)) {
      const maxKey = splitKeys.sort()[splitKeys.length - 1];
      if (maxKey) {
        const pattern = new RegExp('\\d+$');
        const result = maxKey.match(pattern);
        if (result) {
          return parseInt(result[0]);
        }
      }
    }
  }

  static getMaxSplitKeyFromData(data, key): number {
    const keys = WebConfig.getDataContainerKeys(data, key);
    return WebConfig.getMaxSplitKeyFromArray(keys);
  }

  static getSyncStorage(keys: string | string[] | Record<string, unknown>) {
    if (typeof keys === 'string') { keys = [keys]; }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(keys, (data) => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError.message)
          : resolve(data);
      });
    });
  }

  // keys: Requested keys (defaults to all)
  // syncKeys: Keys to get from browser.storage.sync
  // localKeys: Keys to get from browser.storage.local
  // Note: syncLargeKeys will always be returned because it is required
  static async load(keys: string | string[] = []) {
    if (typeof keys === 'string') { keys = [keys]; }
    const localKeys = [];
    let localData;

    // No keys provided, load everything
    if (keys.length === 0) {
      keys = Object.keys(WebConfig._defaults);
      keys.push('words'); // words is not part of _defaults
    }
    let syncKeys = Array.from(keys);

    let includesLargeKeys = false;
    keys.forEach((key) => {
      if (WebConfig._splittingKeys.includes(key)) {
        includesLargeKeys = true;

        // Prepare to get split large keys (_words0..N)
        syncKeys.splice(syncKeys.indexOf(key), 1);
        syncKeys = syncKeys.concat(WebConfig.splitKeyNames(key));
      } else {
        syncKeys.push(key);
      }
    });

    // Add syncLargeKeys because it is required
    if (includesLargeKeys && !keys.includes('syncLargeKeys')) {
      keys.push('syncLargeKeys');
      syncKeys.push('syncLargeKeys');
    }

    const syncData = await WebConfig.getSyncStorage(syncKeys);
    const data = {} as any;

    // Assign values to data and fill in defaults for missing keys (Ignoring large keys)
    keys.forEach((key) => {
      if (!WebConfig._splittingKeys.includes(key)) {
        if (syncData[key] === undefined) {
          data[key] = WebConfig._defaults[key];
        } else {
          data[key] = syncData[key];
        }
      }
    });

    // Now add values for large keys or fill in defaults
    if (includesLargeKeys) {
      if (syncData['syncLargeKeys']) {
        data._lastSplitKeys = {};
        WebConfig._splittingKeys.forEach((splittingKey) => {
          if (keys.includes(splittingKey)) {
            const splitKeys = WebConfig.combineData(syncData, splittingKey);
            if (splitKeys) {
              data._lastSplitKeys[splittingKey] = WebConfig.getMaxSplitKeyFromArray(splitKeys);
              data[splittingKey] = syncData[splittingKey];
            } else { // Add defaults if nothing was returned
              data._lastSplitKeys[splittingKey] = 0;
              if (splittingKey === 'words') {
                data[splittingKey] = WebConfig._defaultWords;
              } else {
                data[splittingKey] = WebConfig._defaults[splittingKey];
              }
            }
          }
        });
      } else {
        // Load large keys from LocalStorage if necessary
        WebConfig._splittingKeys.forEach((splittingKey) => {
          if (keys.includes(splittingKey)) {
            localKeys.push(splittingKey);
          }
        });

        if (localKeys.length) {
          localData = await WebConfig.getLocalStorage(localKeys);

          // Add large keys from LocalStorage to data
          localKeys.forEach((localKey) => {
            // Ensure defaults
            if (localData[localKey] === undefined) {
              // 'words' are not included in Webconfig._defaults
              if (localKey === 'words') {
                data[localKey] = WebConfig._defaultWords;
              } else {
                data[localKey] = WebConfig._defaults[localKey];
              }
            } else {
              data[localKey] = localData[localKey];
            }
          });
        }
      }
    }

    return new WebConfig(data);
  }

  static removeLocalStorage(keys: string | string[]) {
    if (keys === 'ALL') {
      return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
          chrome.runtime.lastError
            ? reject(chrome.runtime.lastError.message)
            : resolve(0);
        });
      });
    }

    if (typeof keys === 'string') { keys = [keys]; }

    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError.message)
          : resolve(0);
      });
    });
  }

  static removeSyncStorage(keys: string | string[]) {
    if (typeof keys === 'string') { keys = [keys]; }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.remove(keys, () => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError.message)
          : resolve(0);
      });
    });
  }

  static resetLocalStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError.message)
          : resolve(0);
      });
    });
  }

  static resetSyncStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.clear(() => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError.message)
          : resolve(0);
      });
    });
  }

  static saveLocalStorage(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError.message)
          : resolve(0);
      });
    });
  }

  static saveSyncStorage(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(data, () => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError.message)
          : resolve(0);
      });
    });
  }

  static splitKeyNames(key: string, start: number = 0) {
    return Array(this._maxSplitKeys - start).fill(1).map((item, index) => '_' + key + (index + start));
  }

  // Call load() to create a new instance
  constructor(config) {
    if (typeof config === 'undefined') {
      throw new Error('Cannot be called directly. call load()');
    }

    super(); // Get the Config defaults
    Object.assign(this, WebConfig._classDefaults, config); // Separate due to _defineProperty()
  }

  // Order and remove `_` prefixed values
  ordered() {
    return Object.keys(this).sort().reduce((obj, key) => {
      if (key[0] != '_') { obj[key] = this[key]; }
      return obj;
    }, {});
  }

  // Note: Defaults are not automatically loaded after removing an item
  async remove(keys: string | string[]) {
    if (typeof keys === 'string') { keys = [keys]; }
    let syncKeys = [];
    const localKeys = [];

    if (keys.length > 0) {
      keys.forEach((key) => {
        if (WebConfig._splittingKeys.includes(key)) {
          if (this.syncLargeKeys) {
            syncKeys = syncKeys.concat(WebConfig.splitKeyNames(key));
          } else {
            localKeys.push(key);
          }
        } else {
          syncKeys.push(key);
        }
      });

      try {
        if (syncKeys.length) {
          await WebConfig.removeSyncStorage(syncKeys);
        }
        if (localKeys.length) {
          await WebConfig.removeLocalStorage(localKeys);
        }

        keys.forEach((prop) => {
          delete this[prop];
        });
      } catch(e) {
        logger.error('Failed to remove items: ', keys, e);
        throw(`Failed to remove items: [${keys}]. ${e}`);
      }
    }
  }

  async reset() {
    try {
      await WebConfig.resetSyncStorage();
      await WebConfig.resetLocalStorage();
    } catch(e) {
      logger.error('Failed to clear storage: ', e);
      throw(`Failed to clear storage: ${e}`);
    }
  }

  async resetPreserveStats() {
    try {
      await WebConfig.resetSyncStorage();
      await WebConfig.removeLocalStorage(WebConfig._splittingKeys);
    } catch(e) {
      logger.error('Failed to clear storage: ', e);
      throw(`Failed to clear storage: ${e}`);
    }
  }

  async save(keys: string | string[] = []) {
    if (typeof keys === 'string') { keys = [keys]; }
    const syncData = {};
    const localData = {};

    // No keys provided, save everything
    if (keys.length === 0) {
      keys = Object.keys(WebConfig._defaults);
      keys.push('words'); // words is not part of _defaults
    }

    let unusedSplitKeys = [];
    keys.forEach((key) => {
      if (WebConfig._splittingKeys.includes(key)) {
        if (this.syncLargeKeys) {
          Object.assign(syncData, this.splitData(key));

          // Check for any unused splitContainers
          if (this._lastSplitKeys) {
            const newMaxSplitKey = WebConfig.getMaxSplitKeyFromData(syncData, key);
            if (this._lastSplitKeys[key] > newMaxSplitKey) {
              unusedSplitKeys = unusedSplitKeys.concat(WebConfig.splitKeyNames(key, newMaxSplitKey));
            }
          }
        } else {
          localData[key] = this[key];
        }
      } else {
        syncData[key] = this[key];
      }
    });

    if (Object.keys(syncData).length) {
      await WebConfig.saveSyncStorage(syncData);
    }
    if (Object.keys(localData).length) {
      await WebConfig.saveLocalStorage(localData);
    }
    if (unusedSplitKeys.length) {
      await this.remove(unusedSplitKeys);
    }
  }

  splitData(key: string) {
    const encoder = new TextEncoder();
    let currentContainerNum = 0;
    let currentBytes = 2; // For double-quotes around entire stringified JSON
    const data = {};

    let currentContainer = `_${key}${currentContainerNum}`;
    data[currentContainer] = {};
    currentBytes += encoder.encode(`{"${currentContainer}":{}}`).length;

    Object.keys(this[key]).sort().forEach((item) => {
      let newBytes = encoder.encode(`",${item}":`).length; // This leads to an extra ',' for the last entry
      newBytes += encoder.encode(JSON.stringify(this[key][item])).length;

      // Next word would be too big, setup next container
      if ((currentBytes + newBytes) >= WebConfig._maxBytes) {
        currentContainerNum++;
        currentContainer = `_${key}${currentContainerNum}`;
        data[currentContainer] = {};
        currentBytes = encoder.encode(`"${currentContainer}":{}`).length;
      }

      // Adding a word
      currentBytes += newBytes;
      data[currentContainer][item] = this[key][item];
    });

    return data;
  }
}