import Constants from './lib/constants';
import Config from './lib/config';

export default class WebConfig extends Config {
  _splitContainerKeys: { [key: string]: string[] };
  audioWordlistId: number;
  customAudioSites: { [site: string]: AudioRule[] };
  domains: { [site: string]: DomainCfg };
  enabledDomainsOnly: boolean;
  muteAudio: boolean;
  muteAudioOnly: boolean;
  muteCueRequireShowing: boolean;
  muteMethod: number;
  password: string;
  showSubtitles: number;
  showUpdateNotification: boolean;
  youTubeAutoSubsMax: number;
  youTubeAutoSubsMin: number;

  static readonly _classDefaults = {
    domains: {},
    audioWordlistId: 0,
    customAudioSites: null,
    enabledDomainsOnly: false,
    muteAudio: false,
    muteAudioOnly: false,
    muteCueRequireShowing: false,
    muteMethod: Constants.MuteMethods.Tab,
    password: null,
    showSubtitles: Constants.ShowSubtitles.All,
    showUpdateNotification: true,
    youTubeAutoSubsMax: 0,
    youTubeAutoSubsMin: 0,
  }

  static readonly QUOTA_BYTES_PER_ITEM = 8192; // https://developer.chrome.com/apps/storage chrome.storage.sync.QUOTA_BYTES_PER_ITEM
  static readonly _defaults = Object.assign({}, Config._defaults, WebConfig._classDefaults);
  static readonly _splittingKeys = ['domains', 'words'];
  static readonly _maxBytes = 8000;

  static async build(keys: string | string[] = []) {
    if (typeof keys === 'string') { keys = [keys]; }
    let asyncResult = await WebConfig.getConfig(keys);
    let instance = new WebConfig(asyncResult);
    return instance;
  }

  // Call build() to create a new instance
  constructor(asyncParam) {
    if (typeof asyncParam === 'undefined') {
      throw new Error('Cannot be called directly. call build()');
    }

    super(); // Get the Config defaults
    this._splitContainerKeys = {};
    Object.assign(this, WebConfig._classDefaults, asyncParam); // Separate due to _defineProperty()
  }

  // Combine all ._[prop]* into .[prop]
  static combineData(data, prop: string): string[] {
    data[prop] = {};
    if (data[`_${prop}0`] !== undefined) {
      let dataKeys = WebConfig.getDataContainerKeys(data, prop);

      // Add all _[prop]* to .[prop] and remove _[prop]*
      dataKeys.forEach(function(key) {
        Object.assign(data[prop], data[key]);
        delete data[key];
      });
      return dataKeys;
    }
  }

  // Async call to get provided keys (or default keys) from chrome storage
  static getConfig(keys: string[]) {
    return new Promise(function(resolve, reject) {
      let request = null; // Get all data from storage

      if (keys.length > 0 && ! keys.some(key => WebConfig._splittingKeys.includes(key))) {
        request = {};
        keys.forEach(key => { request[key] = WebConfig._defaults[key]; });
      }

      chrome.storage.sync.get(request, function(items) {
        // Add internal tracker for split keys
        items._splitContainerKeys = {};

        // Ensure defaults for undefined settings
        Object.keys(WebConfig._defaults).forEach(function(defaultKey) {
          if ((request == null || keys.includes(defaultKey)) && items[defaultKey] === undefined) {
            items[defaultKey] = WebConfig._defaults[defaultKey];
          }
        });

        // Add words if requested, and provide _defaultWords if needed
        if (keys.length === 0 || keys.includes('words')) {
          // Use default words if none were provided
          if (items._words0 === undefined || Object.keys(items._words0).length == 0) {
            items._words0 = Config._defaultWords;
          }
        }

        WebConfig._splittingKeys.forEach(function(splittingKey) {
          let keys = WebConfig.combineData(items, splittingKey);
          if (keys) { items._splitContainerKeys[splittingKey] = keys; }
        });

        // Remove keys we didn't request (Required when requests for specific keys include ones that supports splitting)
        if (request !== null && keys.length > 0) {
          Object.keys(items).forEach(function(item) {
            if (!keys.includes(item)) {
              delete items[item];
            }
          });
        }

        resolve(items);
      });
    });
  }

  // Find all _[prop]* to combine
  static getDataContainerKeys(data, prop) {
    let pattern = new RegExp(`^_${prop}\\d+`);
    let containerKeys = Object.keys(data).filter(function(key) {
      return pattern.test(key);
    });

    return containerKeys;
  }

  // Order and remove `_` prefixed values
  ordered() {
    let self = this;
    return Object.keys(self).sort().reduce((obj, key) => {
      if (key[0] != '_') { obj[key] = self[key]; }
      return obj;
    }, {});
  }

  remove(props: string | string[]) {
    let self = this;
    if (typeof props === 'string') { props = [props]; }
    chrome.storage.sync.remove(props);
    props.forEach(function(prop) {
      delete self[prop];
    });
  }

  reset() {
    return new Promise(function(resolve, reject) {
      chrome.storage.sync.clear(function() {
        resolve(chrome.runtime.lastError ? 1 : 0);
      });
    });
  }

  // Pass a key or array of keys to save, or save everything
  save(props: string | string[] = []) {
    let self = this;
    if (typeof props === 'string') { props = [props]; }
    let data = {};

    // Save everything
    if (props.length === 0) {
      props = Object.keys(WebConfig._defaults);
      props.push('words'); // words is not part of _defaults
    }

    props.forEach(function(prop) {
      if (WebConfig._splittingKeys.includes(prop)) {
        Object.assign(data, self.splitData(prop));
      } else {
        data[prop] = self[prop];
      }
    });

    // If we have more containers in storage than are needed, remove them
    if (Object.keys(self._splitContainerKeys).length !== 0 && props.some(prop => WebConfig._splittingKeys.includes(prop))) {
      WebConfig._splittingKeys.forEach(function(splittingKey) {
        if (props.includes(splittingKey)) {
          let newContainerKeys = WebConfig.getDataContainerKeys(data, splittingKey);
          if (self._splitContainerKeys[splittingKey]) {
            let containersToRemove = self._splitContainerKeys[splittingKey].filter(oldKey => !newContainerKeys.includes(oldKey));
            if (containersToRemove.length !== 0) {
              self.remove(containersToRemove);
              self._splitContainerKeys[splittingKey] = newContainerKeys;
            }
          }
        }
      });
    }

    return new Promise(function(resolve, reject) {
      chrome.storage.sync.set(data, function() {
        resolve(chrome.runtime.lastError ? 1 : 0);
      });
    });
  }

  splitData(key: string) {
    let self = this;
    const encoder = new TextEncoder();
    let currentContainerNum = 0;
    let currentBytes = 2; // For double-quotes around entire stringified JSON
    let data = {};

    let currentContainer = `_${key}${currentContainerNum}`;
    data[currentContainer] = {};
    currentBytes += encoder.encode(`{"${currentContainer}":{}}`).length;

    Object.keys(self[key]).sort().forEach(function(item) {
      let newBytes = encoder.encode(`",${item}":`).length; // This leads to an extra ',' for the last entry
      newBytes += encoder.encode(JSON.stringify(self[key][item])).length;

      // Next word would be too big, setup next container
      if ((currentBytes + newBytes) >= WebConfig._maxBytes) {
        currentContainerNum++;
        currentContainer = `_${key}${currentContainerNum}`;
        data[currentContainer] = {};
        currentBytes = encoder.encode(`"${currentContainer}":{}`).length;
      }

      // Adding a word
      currentBytes += newBytes;
      data[currentContainer][item] = self[key][item];
    });

    return data;
  }
}