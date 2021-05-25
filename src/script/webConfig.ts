import Constants from './lib/constants';
import Config from './lib/config';

export default class WebConfig extends Config {
  _splitContainerKeys: { [key: string]: string[] };
  audioWordlistId: number;
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
  youTubeAutoSubsMax: number;
  youTubeAutoSubsMin: number;

  static readonly _classDefaults = {
    audioWordlistId: 0,
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
    showUpdateNotification: true,
    youTubeAutoSubsMax: 0,
    youTubeAutoSubsMin: 0,
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  static readonly QUOTA_BYTES_PER_ITEM = 8192; // https://developer.chrome.com/apps/storage chrome.storage.sync.QUOTA_BYTES_PER_ITEM
  static readonly _defaults = Object.assign({}, Config._defaults, WebConfig._classDefaults);
  static readonly _splittingKeys = ['domains', 'words'];
  static readonly _maxBytes = 8000;

  static async build(keys: string | string[] = []) {
    if (typeof keys === 'string') { keys = [keys]; }
    const asyncResult = await WebConfig.getConfig(keys);
    const instance = new WebConfig(asyncResult);
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
      const dataKeys = WebConfig.getDataContainerKeys(data, prop);

      // Add all _[prop]* to .[prop] and remove _[prop]*
      dataKeys.forEach((key) => {
        Object.assign(data[prop], data[key]);
        delete data[key];
      });
      return dataKeys;
    }
  }

  // Async call to get provided keys (or default keys) from chrome storage
  static getConfig(keys: string[]) {
    return new Promise((resolve, reject) => {
      let request = null; // Get all data from storage

      if (keys.length > 0 && ! keys.some((key) => WebConfig._splittingKeys.includes(key))) {
        request = {};
        keys.forEach((key) => { request[key] = WebConfig._defaults[key]; });
      }

      chrome.storage.sync.get(request, (items) => {
        // Add internal tracker for split keys
        items._splitContainerKeys = {};

        // Ensure defaults for undefined settings
        Object.keys(WebConfig._defaults).forEach((defaultKey) => {
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

        WebConfig._splittingKeys.forEach((splittingKey) => {
          const splitKeys = WebConfig.combineData(items, splittingKey);
          if (splitKeys) { items._splitContainerKeys[splittingKey] = splitKeys; }
        });

        // Remove keys we didn't request (Required when requests for specific keys include ones that supports splitting)
        if (request !== null && keys.length > 0) {
          Object.keys(items).forEach((item) => {
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
    const pattern = new RegExp(`^_${prop}\\d+`);
    const containerKeys = Object.keys(data).filter((key) => pattern.test(key));
    return containerKeys;
  }

  // Order and remove `_` prefixed values
  ordered() {
    return Object.keys(this).sort().reduce((obj, key) => {
      if (key[0] != '_') { obj[key] = this[key]; }
      return obj;
    }, {});
  }

  remove(props: string | string[]) {
    if (typeof props === 'string') { props = [props]; }
    chrome.storage.sync.remove(props);
    props.forEach((prop) => {
      delete this[prop];
    });
  }

  reset() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.clear(() => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError.message)
          : resolve(0);
      });
    });
  }

  // Pass a key or array of keys to save, or save everything
  save(props: string | string[] = []) {
    if (typeof props === 'string') { props = [props]; }
    const data = {};

    // Save everything
    if (props.length === 0) {
      props = Object.keys(WebConfig._defaults);
      props.push('words'); // words is not part of _defaults
    }

    props.forEach((prop) => {
      if (WebConfig._splittingKeys.includes(prop)) {
        Object.assign(data, this.splitData(prop));
      } else {
        data[prop] = this[prop];
      }
    });

    // If we have more containers in storage than are needed, remove them
    if (Object.keys(this._splitContainerKeys).length !== 0 && props.some((prop) => WebConfig._splittingKeys.includes(prop))) {
      WebConfig._splittingKeys.forEach((splittingKey) => {
        if (props.includes(splittingKey)) {
          const newContainerKeys = WebConfig.getDataContainerKeys(data, splittingKey);
          if (this._splitContainerKeys[splittingKey]) {
            const containersToRemove = this._splitContainerKeys[splittingKey].filter((oldKey) => !newContainerKeys.includes(oldKey));
            if (containersToRemove.length !== 0) {
              this.remove(containersToRemove);
              this._splitContainerKeys[splittingKey] = newContainerKeys;
            }
          }
        }
      });
    }

    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(data, () => {
        chrome.runtime.lastError
          ? reject(chrome.runtime.lastError.message)
          : resolve(0);
      });
    });
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