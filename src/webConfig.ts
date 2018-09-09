import Config from './lib/config.js';

export default class WebConfig extends Config {
  static async build(keys?: string[]) {
    let async_result = await WebConfig.getConfig(keys);
    let instance = new WebConfig(async_result);
    return instance;
  }

  // Call build() to create a new instance
  constructor(async_param) {
    super(async_param);
  }

  // Compile words
  static combineWords(items) {
    items.words = {};
    if (items._words0 !== undefined) {
      // Find all _words* to combine
      let wordKeys = Object.keys(items).filter(function(key) {
        return Config._wordsPattern.test(key);
      });

      // Add all _words* to words and remove _words*
      wordKeys.forEach(function(key) {
        Object.assign(items.words, items[key]);
        delete items[key];
      });
    }
    // console.log('combineWords', items); // DEBUG
  }

  // Persist all configs from defaults and split _words*
  dataToPersist() {
    let self = this;
    let data = {};

    // Save all settings using keys from _defaults
    Object.keys(Config._defaults).forEach(function(key) {
      if (self[key] !== undefined) {
        data[key] = self[key];
      }
    });

    if (self.words) {
      // Split words back into _words* for storage
      let splitWords = self.splitWords();
      Object.keys(splitWords).forEach(function(key) {
        data[key] = splitWords[key];
      });

      let wordKeys = Object.keys(self).filter(function(key) {
        return Config._wordsPattern.test(key);
      });

      wordKeys.forEach(function(key){
        data[key] = self[key];
      });
    }

    // console.log('dataToPersist', data); // DEBUG - Config
    return data;
  }

  // Async call to get provided keys (or default keys) from chrome storage
  // TODO: Keys: Doesn't support getting words
  static getConfig(keys?: string[]) {
    return new Promise(function(resolve, reject) {
      // Generate a request to use with chrome.storage
      let request = null;
      if (keys !== undefined) {
        request = {};
        for(let k of keys) { request[k] = Config._defaults[k]; }
      }

      chrome.storage.sync.get(request, function(items) {
        // Ensure defaults for undefined settings
        Object.keys(Config._defaults).forEach(function(defaultKey){
          if (request == null || Object.keys(request).includes(defaultKey)) {
            if (items[defaultKey] === undefined) {
              items[defaultKey] = Config._defaults[defaultKey];
            }
          }
        });

        // Add words if requested, and provide _defaultWords if needed
        if (keys === undefined || keys.includes('words')) {
          // Use default words if none were provided
          if (items._words0 === undefined || Object.keys(items._words0).length == 0) {
            items._words0 = Config._defaultWords;
          }
          WebConfig.combineWords(items);
        }

        resolve(items);
      });
    });
  }

  removeProp(prop: string) {
    chrome.storage.sync.remove(prop);
    delete this[prop];
  }

  reset() {
    return new Promise(function(resolve, reject) {
      chrome.storage.sync.clear(function() {
        resolve(chrome.runtime.lastError ? 1 : 0);
      });
    });
  }

  save() {
    var self = this;
    return new Promise(function(resolve, reject) {
      chrome.storage.sync.set(self.dataToPersist(), function() {
        resolve(chrome.runtime.lastError ? 1 : 0);
      });
    });
  }

  splitWords() {
    let self = this;
    let currentContainerNum = 0;
    let currentWordNum = 0;
    // let wordsLength = JSON.stringify(self.words).length;
    // let wordContainers = Math.ceil(wordsLength/Config._maxBytes);
    // let wordsNum = Object.keys(self.words).length;
    let words = {};
    words[`_words${currentContainerNum}`] = {};

    Object.keys(self.words).sort().forEach(function(word) {
      if (currentWordNum == Config._maxWords) {
        currentContainerNum++;
        currentWordNum = 0;
        words[`_words${currentContainerNum}`] = {};
      }
      words[`_words${currentContainerNum}`][word] = self.words[word];
      currentWordNum++;
    });

    return words;
  }

}