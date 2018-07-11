/// <reference path="helper.ts" />
class Config {
  censorCharacter: string;
  censorFixedLength: number;
  defaultSubstitutions: string[];
  disabledDomains: string[];
  filterMethod: number;
  globalMatchMethod: number;
  password: string;
  preserveCase: boolean;
  preserveFirst: boolean;
  preserveLast: boolean;
  showCounter: boolean;
  substitutionMark: boolean;
  wordList: string[];
  words: {
    [key: string]: {
      matchMethod: number;
      words: string[];
    }
  };

  static readonly _defaults = {
    "censorCharacter": "*",
    "censorFixedLength": 0,
    "defaultSubstitutions": ["censored", "expletive", "filtered"],
    "disabledDomains": [],
    "filterMethod": 0, // ["Censor", "Substitute", "Remove"];
    "globalMatchMethod": 3, // ["Exact", "Partial", "Whole", "Per-Word", "RegExp"]
    "password": null,
    "preserveCase": true,
    "preserveFirst": true,
    "preserveLast": false,
    "showCounter": true,
    "substitutionMark": true
  };

  private static readonly _defaultWords = {
    "ass": { "matchMethod": 0, "words": ["butt", "tail"] },
    "asses": { "matchMethod": 0, "words": ["butts"] },
    "asshole": { "matchMethod": 1, "words": ["butthole", "jerk"] },
    "bastard": { "matchMethod": 1, "words": ["imperfect", "impure"] },
    "bitch": { "matchMethod": 1, "words": ["jerk"] },
    "cunt": { "matchMethod": 1, "words": ["explative"] },
    "damn": { "matchMethod": 1, "words": ["dang", "darn"] },
    "fuck": { "matchMethod": 1, "words": ["freak", "fudge"] },
    "piss": { "matchMethod": 1, "words": ["pee"] },
    "pissed": { "matchMethod": 0, "words": ["ticked"] },
    "slut": { "matchMethod": 1, "words": ["imperfect", "impure"] },
    "shit": { "matchMethod": 1, "words": ["crap", "crud", "poop"] },
    "tits": { "matchMethod": 1, "words": ["explative"] },
    "whore": { "matchMethod": 1, "words": ["harlot", "tramp"] }
  };

  static readonly _filterMethodNames = ["Censor", "Substitute", "Remove"];
  static readonly _matchMethodNames = ["Exact Match", "Partial Match", "Whole Match", "Per-Word Match", "Regular Expression"];
  static readonly _maxBytes = 6500;
  static readonly _maxWords = 100;
  static readonly _wordsPattern = /^_words\d+/;

  static async build(keys?: string[]) {
    let async_result = await Config.getConfig(keys);
    let instance = new Config(async_result);
    return instance;
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

  // Call build() to create a new instance
  constructor(async_param) {
    if (typeof async_param === 'undefined') {
      throw new Error('Cannot be called directly. call build()');
    }
    // TODO: Not supported yet
    // Object.assign(async_param, this);
    for(let k in async_param) this[k]=async_param[k];
  }

  // Persist all configs from defaults and split _words*
  dataToPersist() {
    let self = this;
    let data = {};

    // Save all settings using keys from _defaults
    Object.keys(Config._defaults).forEach(function(key) {
      data[key] = self[key];
    });

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
   })

    // console.log('dataToPersist', data); // DEBUG
    return data;
  }

  // Async call to get provided keys (or default keys) from chrome storage
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
          if (items[defaultKey] === undefined) {
            items[defaultKey] = Config._defaults[defaultKey];
          }
        });

        // Add words if requested, and provide defaults if needed
        if (keys === undefined || arrayContains(keys, 'words')) {
          // Use default words if none were provided
          // TODO
          if (items._words0 && Object.keys(items._words0).length === 0 ) { // && items.words.constructor === Object) {
            items._words0 = Config._defaultWords;
          }
          Config.combineWords(items);
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