import Config from './lib/config';

export default class WebConfig extends Config {
  _wordContainerKeys: string[];
  advancedDomains: string[];
  audioWordlistId: number;
  customAudioSites: { [site: string]: AudioRules[] };
  disabledDomains: string[];
  enabledDomains: string[];
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
    advancedDomains: [],
    audioWordlistId: 0,
    customAudioSites: null,
    disabledDomains: [],
    enabledDomains: [],
    enabledDomainsOnly: false,
    muteAudio: false,
    muteAudioOnly: false,
    muteCueRequireShowing: true,
    muteMethod: 0, // 0: Mute Tab, 1: Video Volume
    password: null,
    showSubtitles: 0,
    showUpdateNotification: true,
    youTubeAutoSubsMax: 0,
    youTubeAutoSubsMin: 0,
  }

  static readonly QUOTA_BYTES_PER_ITEM = 8192; // https://developer.chrome.com/apps/storage chrome.storage.sync.QUOTA_BYTES_PER_ITEM
  static readonly _defaults = Object.assign(Config._defaults, WebConfig._classDefaults);
  static readonly _maxBytes = 8000;
  static readonly _wordsContainerPrefix = '_words'
  static readonly _wordsPattern = /^_words\d+/;

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
    this._wordContainerKeys = [];
    Object.assign(this, WebConfig._classDefaults, asyncParam); // Separate due to _defineProperty()
  }

  // Combine all ._words* into .words
  static combineWords(items): string[] {
    items.words = {};
    if (items._words0 !== undefined) {
      let wordKeys = WebConfig.getWordContainerKeys(items);

      // Add all _words* to words and remove _words*
      wordKeys.forEach(function(key) {
        Object.assign(items.words, items[key]);
        delete items[key];
      });
      return wordKeys;
    }
  }

  // Async call to get provided keys (or default keys) from chrome storage
  static getConfig(keys: string[]) {
    return new Promise(function(resolve, reject) {
      let request = null; // Get all data from storage

      if (keys.length > 0 && !keys.includes('words')) {
        request = {};
        keys.forEach(key => { request[key] = WebConfig._defaults[key]; });
      }

      chrome.storage.sync.get(request, function(items) {
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
          items._wordContainerKeys = WebConfig.combineWords(items);
        }

        // Remove keys we didn't request (needed for _words*)
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

  // Find all _words* to combine
  static getWordContainerKeys(items) {
    let containerKeys = Object.keys(items).filter(function(key) {
      return WebConfig._wordsPattern.test(key);
    });

    return containerKeys;
  }

  ordered() {
    let self = this;
    return Object.keys(self).sort().reduce((obj, key) => {
      obj[key] = self[key];
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
      props.push('words');
    }

    props.forEach(function(prop) {
      if (prop === 'words') {
        Object.assign(data, self.splitWords());
      } else {
        data[prop] = self[prop];
      }
    });

    // If we have more containers in storage than are needed, remove them
    if (props.length === 0 || props.includes('words')) {
      let newWordKeys = WebConfig.getWordContainerKeys(data);
      let containersToRemove = self._wordContainerKeys.filter(oldKey => !newWordKeys.includes(oldKey));
      if (containersToRemove.length !== 0) {
        self.remove(containersToRemove);
        self._wordContainerKeys = newWordKeys;
      }
    }

    return new Promise(function(resolve, reject) {
      chrome.storage.sync.set(data, function() {
        resolve(chrome.runtime.lastError ? 1 : 0);
      });
    });
  }

  splitWords() {
    let self = this;
    const encoder = new TextEncoder();
    let currentContainerNum = 0;
    let currentBytes = 2; // For double-quotes around entire stringified JSON
    let words = {};

    let currentContainer = `${WebConfig._wordsContainerPrefix}${currentContainerNum}`;
    words[currentContainer] = {};
    currentBytes += encoder.encode(`{"${currentContainer}":{}}`).length;

    Object.keys(self.words).sort().forEach(function(word) {
      let newBytes = encoder.encode(`",${word}":`).length; // This leads to an extra ',' for the last entry
      newBytes += encoder.encode(JSON.stringify(self.words[word])).length;

      // Next word would be too big, setup next container
      if ((currentBytes + newBytes) >= WebConfig._maxBytes) {
        currentContainerNum++;
        currentContainer = `${WebConfig._wordsContainerPrefix}${currentContainerNum}`;
        words[currentContainer] = {};
        currentBytes = encoder.encode(`"${currentContainer}":{}`).length;
      }

      // Adding a word
      currentBytes += newBytes;
      words[currentContainer][word] = self.words[word];
    });

    return words;
  }
}