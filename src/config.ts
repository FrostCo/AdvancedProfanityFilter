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
    "substitutionMark": true,
    "words": {}
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

  static async build(keys?: string[]) {
    let async_result = await Config.getConfig(keys);
    let instance = new Config(async_result);
    return instance;
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

  // Async call to get provided keys (or default keys) from chrome storage
  static getConfig(keys?: string[]) {
    return new Promise(function(resolve, reject) {
      // Generate a request to use with chrome.storage
      let request = {};
      if (keys === undefined) {
        request = Config._defaults
      } else {
        for(let k of keys) { request[k] = Config._defaults[k]; }
      }

      chrome.storage.sync.get(request, function(items) {
        // Only include words if requested
        if (keys === undefined || arrayContains(keys, 'words')) {
          // Use default words if none were provided
          if (Object.keys(items.words).length === 0 && items.words.constructor === Object) {
            items.words = Config._defaultWords;
          }
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
    let self = this;
    return new Promise(function(resolve, reject) {
      chrome.storage.sync.set(self, function() {
        resolve(chrome.runtime.lastError ? 1 : 0);
      });
    });
  }

  saveProp({prop: string, val: any}) {
    // let cfg = this;
    // cfg[prop] = val;
    // return new Promise(function(resolve, reject) {
    //     chrome.storage.sync.set(cfg, function() {
    //         resolve(chrome.runtime.lastError ? 1 : 0);
    //     });
    // });
  }

  setProp(event, prop: string, value: any) {
    this[prop] = value;
  }
}