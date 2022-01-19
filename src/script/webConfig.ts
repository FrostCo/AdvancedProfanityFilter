import Constants from './lib/constants';
import Config from './lib/config';
import { stringArray } from './lib/helper';
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
  static readonly _localConfigKeys = ['domains', 'syncLargeKeys', 'words'];
  static readonly _maxBytes = 8000;
  static readonly _maxSplitKeys = 64;
  static readonly _largeKeys = ['domains', 'words'];

  static chromeStorageAvailable(): boolean {
    return !!(chrome && chrome.storage && chrome.storage.sync && chrome.storage.local);
  }

  // Combine all ._[key]* into .[key]
  static combineData(data, key: string): string[] {
    data[key] = {};
    if (data[`_${key}0`] !== undefined) {
      const dataKeys = WebConfig.getDataContainerKeys(data, key);

      // Add all _[key]* to .[key] and remove _[key]*
      dataKeys.forEach((dataKey) => {
        Object.assign(data[key], data[dataKey]);
        delete data[dataKey];
      });
      return dataKeys;
    }
  }

  // Find all _[key]* to combine
  static getDataContainerKeys(data, key: string): string[] {
    const pattern = new RegExp(`^_${key}\\d+`);
    const containerKeys = Object.keys(data).filter((dataKey) => pattern.test(dataKey));
    return containerKeys.sort();
  }

  static getLocalStorage(keys: string | string[] | Record<string, unknown>) {
    if (typeof keys === 'string') { keys = [keys]; }

    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (data) => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError)
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

  static getMaxSplitKeyFromData(data, key: string): number {
    const keys = WebConfig.getDataContainerKeys(data, key);
    return WebConfig.getMaxSplitKeyFromArray(keys);
  }

  static getSyncStorage(keys: string | string[] | Record<string, unknown>) {
    if (typeof keys === 'string') { keys = [keys]; }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(keys, (data) => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError)
          : resolve(data);
      });
    });
  }

  static includesLargeKeys(keys: string[]) {
    return keys.some((key) => { return WebConfig._largeKeys.includes(key); });
  }

  // keys: Requested keys (defaults to all)
  // syncKeys: Keys to get from browser.storage.sync
  // localKeys: Keys to get from browser.storage.local
  // Note: syncLargeKeys will be returned when required
  static async load(keys: string | string[] = []) {
    keys = stringArray(keys);
    const data = {} as any;
    let localData;
    const localKeys = [];
    let syncKeys = [];

    // No keys provided, load everything
    if (keys.length === 0) {
      keys = Object.keys(WebConfig._defaults);
      keys.push('words'); // words is not part of _defaults
    }

    try {
      if (WebConfig.includesLargeKeys(keys)) {
        // Add syncLargeKeys if any largeKeys were requested
        if (!keys.includes('syncLargeKeys')) {
          keys.push('syncLargeKeys');
        }

        // Load large keys from LocalStorage if necessary
        WebConfig._localConfigKeys.forEach((localKey) => {
          if (keys.includes(localKey)) {
            localKeys.push(localKey);
          }
        });
        localData = await WebConfig.getLocalStorage(localKeys);
        data.syncLargeKeys = localData.syncLargeKeys === false ? localData.syncLargeKeys : WebConfig._defaults.syncLargeKeys;

        if (data.syncLargeKeys === false) { // Use local storage for large keys
          // Add large keys from local storage to data
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

          // Get all keys from sync storage except the ones found in local storage
          syncKeys = keys.filter((key) => { return !WebConfig._localConfigKeys.includes(key); });
        } else { // Use sync storage for large keys
          // Get all keys from sync storage (except syncLargeKeys)
          syncKeys = keys.filter((key) => { return key !== 'syncLargeKeys'; });
        }
      } else {
        // Get all keys from sync storage (except syncLargeKeys)
        syncKeys = keys.filter((key) => { return key !== 'syncLargeKeys'; });
      }

      if (syncKeys.length) {
        // Prepare to get large keys from sync storage if needed
        let syncKeysSplit = [].concat(syncKeys);
        WebConfig._largeKeys.forEach((largeKey) => {
          if (syncKeys.includes(largeKey)) {
            // Prepare to get split large keys (_words0..N)
            syncKeysSplit.splice(syncKeysSplit.indexOf(largeKey), 1);
            syncKeysSplit = syncKeysSplit.concat(WebConfig.splitKeyNames(largeKey));
          }
        });

        const syncData = await WebConfig.getSyncStorage(syncKeysSplit);
        data._lastSplitKeys = {};

        syncKeys.forEach((key) => {
          // If we are getting large keys from sync storage combine them
          if (WebConfig._largeKeys.includes(key)) {
            // Add values for large keys or fill in defaults
            const splitKeys = WebConfig.combineData(syncData, key);
            if (splitKeys) {
              data._lastSplitKeys[key] = WebConfig.getMaxSplitKeyFromArray(splitKeys);
              data[key] = syncData[key];
            } else { // Add defaults if nothing was returned
              data._lastSplitKeys[key] = 0;
              if (key === 'words') {
                data[key] = WebConfig._defaultWords;
              } else {
                data[key] = WebConfig._defaults[key];
              }
            }
          } else {
            // Assign values to data and fill in defaults for missing keys
            if (syncData[key] === undefined) {
              data[key] = WebConfig._defaults[key];
            } else {
              data[key] = syncData[key];
            }
          }
        });
      }

      return new WebConfig(data);
    } catch (e) {
      logger.error('Failed to load items: ', keys, e);
      throw new Error(`Failed to load items [${keys}]: [${e.message}]`);
    }
  }

  static removeLocalStorage(keys: string | string[]) {
    keys = stringArray(keys);

    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError)
          : resolve(0);
      });
    });
  }

  static removeSyncStorage(keys: string | string[]) {
    keys = stringArray(keys);

    return new Promise((resolve, reject) => {
      chrome.storage.sync.remove(keys, () => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError)
          : resolve(0);
      });
    });
  }

  static resetLocalStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError)
          : resolve(0);
      });
    });
  }

  static resetSyncStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.clear(() => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError)
          : resolve(0);
      });
    });
  }

  static saveLocalStorage(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError)
          : resolve(0);
      });
    });
  }

  static saveSyncStorage(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(data, () => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError)
          : resolve(0);
      });
    });
  }

  static splitKeyNames(key: string, start: number = 0): string[] {
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
    keys = stringArray(keys);
    let syncKeys = [];
    const localKeys = [];

    if (keys.length > 0) {
      keys.forEach((key) => {
        if (key == 'syncLargeKeys') {
          // syncLargeKeys is always stored in local storage
          localKeys.push(key);
        } else if (WebConfig._largeKeys.includes(key)) {
          if (this.syncLargeKeys) {
            // Remove large keys from sync storage
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

        keys.forEach((key) => {
          delete this[key];
        });
      } catch (e) {
        logger.error('Failed to remove items: ', keys, e);
        throw new Error(`Failed to remove items: [${keys}]. ${e.message}`);
      }
    }
  }

  async reset() {
    try {
      await WebConfig.resetSyncStorage();
      await WebConfig.resetLocalStorage();
    } catch (e) {
      logger.error('Failed to clear storage.', e);
      throw new Error(`Failed to clear storage: ${e.message}`);
    }
  }

  async resetPreserveStats() {
    try {
      await WebConfig.resetSyncStorage();
      await WebConfig.removeLocalStorage(WebConfig._localConfigKeys);
    } catch (e) {
      logger.error('Failed to clear storage.', e);
      throw new Error(`Failed to clear storage: ${e.message}`);
    }
  }

  async save(keys: string | string[] = []) {
    keys = stringArray(keys);
    const syncData = {};
    const localData = {};

    // No keys provided, save everything
    if (keys.length === 0) {
      keys = Object.keys(WebConfig._defaults);
      keys.push('words'); // words is not part of _defaults
    }

    let unusedSplitKeys = [];
    keys.forEach((key) => {
      if (key == 'syncLargeKeys') {
        // syncLargeKeys is always stored in local storage
        localData[key] = this[key];
      } else if (WebConfig._largeKeys.includes(key)) {
        if (this.syncLargeKeys) {
          Object.assign(syncData, this.splitData(key));

          // Check for any unused splitContainers
          if (this._lastSplitKeys) {
            const newMaxSplitKey = WebConfig.getMaxSplitKeyFromData(syncData, key);
            if (this._lastSplitKeys[key] > newMaxSplitKey) { // Split data was reduced
              unusedSplitKeys = unusedSplitKeys.concat(WebConfig.splitKeyNames(key, newMaxSplitKey + 1));
            } else if (this._lastSplitKeys[key] < newMaxSplitKey) { // Split data was increased
              this._lastSplitKeys[key] = newMaxSplitKey;
            }
          }
        } else {
          localData[key] = this[key];
        }
      } else {
        syncData[key] = this[key];
      }
    });

    try {
      if (Object.keys(syncData).length) {
        await WebConfig.saveSyncStorage(syncData);
      }
      if (Object.keys(localData).length) {
        await WebConfig.saveLocalStorage(localData);
      }
      if (unusedSplitKeys.length) {
        await this.remove(unusedSplitKeys);
      }
    } catch (e) {
      logger.error('Failed to save items: ', keys, e);
      throw new Error(`Failed to save items [${keys}]: [${e.message}]`);
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