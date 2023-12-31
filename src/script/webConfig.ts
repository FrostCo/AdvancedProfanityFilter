import Config from '@APF/lib/config';
import { prettyPrintArray, removeFromArray, sortObjectKeys, stringArray } from '@APF/lib/helper';
import Logger from '@APF/lib/logger';

// __BUILD__ is injected by webpack from ROOT/.build.json
/* eslint-disable-next-line @typescript-eslint/naming-convention */
declare const __BUILD__: { config: any, manifestVersion: number, release: boolean, target: string, version: string };
const BUILD_DEFAULTS = { config: {}, manifestVersion: 3, release: true, target: 'chrome', version: '1.0.0' };
const logger = new Logger('WebConfig');

export default class WebConfig extends Config {
  _lastSplitKeys: { [key: string]: number };
  collectStats: boolean;
  contextMenu: boolean;
  darkMode: boolean;
  domains: { [site: string]: DomainCfg };
  enabledDomainsOnly: boolean;
  enabledFramesOnly: boolean;
  password: string;
  showUpdateNotification: boolean;
  syncLargeKeys: boolean;

  //#region Class reference helpers
  // Can be overridden in children classes
  get Class() { return (this.constructor as typeof WebConfig); }
  //#endregion

  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  static readonly BUILD = typeof __BUILD__ == 'undefined' ? BUILD_DEFAULTS  : __BUILD__;
  static readonly _webDefaults = {
    collectStats: true,
    contextMenu: true,
    darkMode: null,
    domains: {},
    enabledDomainsOnly: false,
    enabledFramesOnly: false,
    password: null,
    showUpdateNotification: false,
    syncLargeKeys: true,
  };

  static _defaults = this.initializeDefaults({}, this._configDefaults, this._webDefaults) as WebConfig;
  static _persistableKeys = Object.keys(this._defaults); // Make sure _defaults has already been assigned before this
  static readonly _localConfigKeys = ['domains', 'syncLargeKeys', 'words'];
  static readonly _localOnlyKeys = ['background', 'stats'];
  static readonly _maxSplitKeys = 64;
  static readonly _largeKeys = ['domains', 'words'];

  static get _maxBytes() {
    try {
      if (chrome.storage.sync.QUOTA_BYTES_PER_ITEM) {
        return Math.round(chrome.storage.sync.QUOTA_BYTES_PER_ITEM * .98);
      } else {
        throw 'QUOTA_BYTES_PER_ITEM not defined, using default';
      }
    } catch (err) {
      // 8192 https://developer.chrome.com/apps/storage
      return 8028;
    }
  }

  static chromeStorageAvailable(): boolean {
    return !!(typeof chrome == 'object' && chrome.storage && chrome.storage.sync && chrome.storage.local);
  }

  // Combine all ._[key]* into .[key]
  static combineData(data, key: string): string[] {
    data[key] = {};
    if (data[`_${key}0`] !== undefined) {
      const dataKeys = this.getDataContainerKeys(data, key);

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
    const keys = this.getDataContainerKeys(data, key);
    return this.getMaxSplitKeyFromArray(keys);
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
    return keys.some((key) => { return this._largeKeys.includes(key); });
  }

  static keysToLoad(keys: string | string[] = []) {
    keys = stringArray(keys);

    // No keys provided, load everything
    if (keys.length === 0) keys = this._persistableKeys;

    return keys;
  }

  // keys: Requested keys (defaults to all)
  // syncKeys: Keys to get from browser.storage.sync
  // localKeys: Keys to get from browser.storage.local
  // Note: syncLargeKeys will be returned when required
  static async load(keys: string | string[] = [], data: Partial<WebConfig> = {}) {
    let syncKeys;
    keys = this.keysToLoad(keys);

    try {
      if (this.includesLargeKeys(keys)) {
        syncKeys = await this.loadLargeKeysFromLocalStorage(keys, data);
      } else {
        // Get all keys from sync storage (except syncLargeKeys)
        syncKeys = removeFromArray(keys, 'syncLargreKeys');
      }

      await this.loadFromSyncStorage(syncKeys, data);
      return new this(data);
    } catch (err) {
      logger.error('Failed to load items.', keys, err);
      throw new Error(`Failed to load items: ${prettyPrintArray(keys)}. [${err.message}]`);
    }
  }

  // Returns list of keys to get from storage.sync
  static async loadLargeKeysFromLocalStorage(keys: string[], data: Partial<WebConfig>): Promise<string[]> {
    // Add syncLargeKeys if any largeKeys were requested
    if (!keys.includes('syncLargeKeys')) keys.push('syncLargeKeys');

    // Load large keys from LocalStorage if necessary
    const localKeys = this.requestedkeysForLocalStorage(keys, data);
    const localData = await this.getLocalStorage(localKeys) as Partial<WebConfig>;
    data.syncLargeKeys = localData.syncLargeKeys === false ? localData.syncLargeKeys : this._defaults.syncLargeKeys;

    if (data.syncLargeKeys === false) { // Use local storage for large keys
      // Add large keys from local storage to data
      for (const localKey of localKeys) {
        if (localData.hasOwnProperty(localKey)) {
          data[localKey] = localData[localKey];
        } else {
          // Ensure defaults
          // 'words' are not included in Webconfig._defaults
          if (localKey === 'words') {
            data[localKey] = this._defaultWords;
          } else {
            data[localKey] = this._defaults[localKey];
          }
        }
      }

      // Get all keys from sync storage except the ones found in local storage
      return removeFromArray(keys, this._localConfigKeys);
    } else { // Use sync storage for large keys
      // Get all keys from sync storage (except syncLargeKeys)
      return removeFromArray(keys, 'syncLargreKeys');
    }
  }

  static async loadFromSyncStorage(syncKeys: string[], data: Partial<WebConfig> = {}) {
    if (!syncKeys.length) return;

    // Prepare to get large keys from sync storage if needed
    let syncKeysSplit = [].concat(syncKeys);
    this._largeKeys.forEach((largeKey) => {
      if (syncKeys.includes(largeKey)) {
        // Prepare to get split large keys (_words0..N)
        syncKeysSplit.splice(syncKeysSplit.indexOf(largeKey), 1);
        syncKeysSplit = syncKeysSplit.concat(this.splitKeyNames(largeKey));
      }
    });

    const syncData = await this.getSyncStorage(syncKeysSplit);
    data._lastSplitKeys = {};

    syncKeys.forEach((key) => {
      // If we are getting large keys from sync storage combine them
      if (this._largeKeys.includes(key)) {
        // Add values for large keys or fill in defaults
        const splitKeys = this.combineData(syncData, key);
        if (splitKeys) {
          data._lastSplitKeys[key] = this.getMaxSplitKeyFromArray(splitKeys);
          data[key] = syncData[key];
        } else { // Add defaults if nothing was returned
          data._lastSplitKeys[key] = 0;
          if (key === 'words') {
            data[key] = this._defaultWords;
          } else {
            data[key] = this._defaults[key];
          }
        }
      } else {
        // Assign values to data and fill in defaults for missing keys
        if (syncData[key] === undefined) {
          data[key] = this._defaults[key];
        } else {
          data[key] = syncData[key];
        }
      }
    });
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

  static requestedkeysForLocalStorage(keys: string[], data: Partial<WebConfig>) {
    return this._localConfigKeys.filter((localKey) => keys.includes(localKey));
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
      throw new Error('Cannot be called directly, call load() instead.');
    }

    // Apply the Config defaults
    super(config);

    // Apply class defaults
    Object.assign(this, this.Class._webDefaults, config);
  }

  // Order and remove `_` prefixed values
  ordered() {
    return sortObjectKeys(this);
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
        } else if (this.Class._largeKeys.includes(key)) {
          if (this.syncLargeKeys) {
            // Remove large keys from sync storage
            syncKeys = syncKeys.concat(this.Class.splitKeyNames(key));
          } else {
            localKeys.push(key);
          }
        } else {
          syncKeys.push(key);
        }
      });

      try {
        if (syncKeys.length) {
          await this.Class.removeSyncStorage(syncKeys);
        }
        if (localKeys.length) {
          await this.Class.removeLocalStorage(localKeys);
        }

        keys.forEach((key) => {
          delete this[key];
        });
      } catch (err) {
        logger.error('Failed to remove items.', keys, err);
        throw new Error(`Failed to remove items: ${prettyPrintArray(keys)}. ${err.message}`);
      }
    }
  }

  async reset() {
    try {
      await this.Class.resetSyncStorage();
      await this.Class.resetLocalStorage();
    } catch (err) {
      logger.error('Failed to clear storage.', err);
      throw new Error(`Failed to clear storage. ${err.message}`);
    }
  }

  async resetPreserveStats() {
    try {
      await this.Class.resetSyncStorage();
      await this.Class.removeLocalStorage(this.Class._localConfigKeys);
    } catch (err) {
      logger.error('Failed to clear storage.', err);
      throw new Error(`Failed to clear storage. ${err.message}`);
    }
  }

  async save(keys: string | string[] = []) {
    keys = stringArray(keys);
    const syncData = {};
    const localData = {};

    // No keys provided, save everything
    if (keys.length === 0) keys = this._persistableKeys;

    let unusedSplitKeys = [];
    keys.forEach((key) => {
      if (key == 'syncLargeKeys') {
        // syncLargeKeys is always stored in local storage
        localData[key] = this[key];
      } else if (this.Class._largeKeys.includes(key)) {
        if (this.syncLargeKeys) {
          Object.assign(syncData, this.splitData(key));

          // Check for any unused splitContainers
          if (this._lastSplitKeys) {
            const newMaxSplitKey = this.Class.getMaxSplitKeyFromData(syncData, key);
            if (this._lastSplitKeys[key] > newMaxSplitKey) { // Split data was reduced
              unusedSplitKeys = unusedSplitKeys.concat(this.Class.splitKeyNames(key, newMaxSplitKey + 1));
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
      // Safari won't store null values
      if (this.Class.BUILD.target === 'safari') {
        const nullLocalKeys = Object.keys(localData).filter((key) => localData[key] == null);
        const nullSyncKeys = Object.keys(syncData).filter((key) => syncData[key] == null);
        if (nullLocalKeys.length) {
          await this.Class.removeLocalStorage(nullLocalKeys);
          nullLocalKeys.forEach((key) => delete localData[key]);
        }
        if (nullSyncKeys.length) {
          await this.Class.removeSyncStorage(nullSyncKeys);
          nullSyncKeys.forEach((key) => delete syncData[key]);
        }
      }

      if (Object.keys(syncData).length) {
        await this.Class.saveSyncStorage(syncData);
      }
      if (Object.keys(localData).length) {
        await this.Class.saveLocalStorage(localData);
      }
      if (unusedSplitKeys.length) {
        await this.remove(unusedSplitKeys);
      }
    } catch (err) {
      logger.error('Failed to save items.', keys, err);
      throw new Error(`Failed to save items: ${prettyPrintArray(keys)}. [${err.message}]`);
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
      if ((currentBytes + newBytes) >= this.Class._maxBytes) {
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
