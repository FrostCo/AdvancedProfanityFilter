import Constants from './lib/constants';
import { getVersion, isVersionOlder } from './lib/helper';
import WebConfig from './webConfig';

export default class DataMigration {
  cfg: WebConfig;

  // Only append so the order stays the same (oldest first).
  static readonly migrations: Migration[] = [
    { version: '1.0.13', name: 'moveToNewWordsStorage', runOnImport: false },
    { version: '1.1.0', name: 'sanitizeWords', runOnImport: true },
    { version: '1.2.0', name: 'singleWordSubstitution', runOnImport: true },
    { version: '2.1.4', name: 'updateDefaultSubs', runOnImport: false },
    { version: '2.3.0', name: 'fixSmartWatch', runOnImport: false },
    { version: '2.7.0', name: 'addWordlistsToWords', runOnImport: true },
    { version: '2.7.0', name: 'removeGlobalMatchMethod', runOnImport: true },
    { version: '2.7.0', name: 'removeOldDomainArrays', runOnImport: true },
    { version: '2.12.0', name: 'overwriteMuteCueRequireShowingDefault', runOnImport: false },
  ];

  constructor(config) {
    this.cfg = config;
  }

  static async build() {
    const cfg = await WebConfig.build();
    return new DataMigration(cfg);
  }

  static latestMigration(): Migration {
    return DataMigration.migrations[DataMigration.migrations.length - 1];
  }

  static migrationNeeded(oldVersion: string): boolean {
    return isVersionOlder(getVersion(oldVersion), getVersion(DataMigration.latestMigration().version));
  }

  // [2.7.0]
  addWordlistsToWords() {
    const cfg = this.cfg as WebConfig;
    Object.keys(cfg.words).forEach((key) => {
      const word = cfg.words[key];
      if (!Array.isArray(word.lists)) {
        word.lists = [];
      }
    });
  }

  // This will look at the version (from before the update) and perform data migrations if necessary
  byVersion(oldVersion: string) {
    const version = getVersion(oldVersion) as Version;
    let migrated = false;
    DataMigration.migrations.forEach((migration) => {
      if (isVersionOlder(version, getVersion(migration.version))) {
        migrated = true;
        this[migration.name]();
      }
    });

    return migrated;
  }

  // [2.3.0]
  fixSmartWatch() {
    const cfg = this.cfg;
    const originalWord = 'twat';
    const originalWordConf = { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, sub: 'dumbo' };
    const update = {
      twat: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, sub: 'dumbo' },
      twats: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, sub: 'dumbos' }
    };

    if (
      cfg.words[originalWord]
      && cfg.words[originalWord].matchMethod == originalWordConf.matchMethod
      && cfg.words[originalWord].sub == originalWordConf.sub
    ) {
      Object.keys(update).forEach((word) => {
        cfg.words[word] = update[word];
      });
    }
  }

  // [1.0.13] - updateRemoveWordsFromStorage - transition from previous words structure under the hood
  moveToNewWordsStorage() {
    chrome.storage.sync.get({ 'words': null }, (oldWords) => {
      if (oldWords.words) {
        chrome.storage.sync.set({ '_words0': oldWords.words }, () => {
          if (!chrome.runtime.lastError) {
            // Remove old words
            chrome.storage.sync.remove('words');
          }
        });
      }
    });
  }

  // This setting has caused some issues for users specifically with Disney+.
  // This migration should only run once, and sets it to the new default of false.
  overwriteMuteCueRequireShowingDefault() {
    const cfg = this.cfg;
    if (cfg.muteCueRequireShowing === true) {
      cfg.muteCueRequireShowing = false;
    }
  }

  removeGlobalMatchMethod() {
    const cfg = this.cfg;
    if ((cfg as any).globalMatchMethod !== undefined) {
      Object.keys(cfg.words).forEach((name) => {
        const word = cfg.words[name];
        // Move RegExp from 4 to 3
        if (word.matchMethod === 4) {
          word.matchMethod = Constants.MATCH_METHODS.REGEX;
        }
      });
      cfg.remove('globalMatchMethod');
    }
  }

  removeOldDomainArrays() {
    const cfg = this.cfg as any;
    if (!cfg.domains) { cfg.domains = {}; }
    const propsToDelete = { advancedDomains: 'adv', disabledDomains: 'disabled', enabledDomains: 'enabled' };
    Object.keys(propsToDelete).forEach((propToDelete) => {
      if (cfg[propToDelete] && Array.isArray(cfg[propToDelete])) {
        if (cfg[propToDelete].length > 0) {
          cfg[propToDelete].forEach((domain) => {
            if (cfg.domains[domain] == undefined) { cfg.domains[domain] = {}; }
            cfg.domains[domain][propsToDelete[propToDelete]] = true;
          });
        }
      }
      delete cfg[propToDelete];
    });
  }

  runImportMigrations() {
    let migrated = false;
    DataMigration.migrations.forEach((migration) => {
      if (migration.runOnImport) {
        migrated = true;
        this[migration.name]();
      }
    });

    return migrated;
  }

  // [1.1.0] - Downcase and trim each word in the list (NOTE: This MAY result in losing some words)
  sanitizeWords() {
    this.cfg.sanitizeWords();
  }

  // [1.2.0] - Change from a word having many substitutions to a single substitution ({words: []} to {sub: ''})
  singleWordSubstitution() {
    const cfg = this.cfg;

    Object.keys(cfg.words).forEach((word) => {
      const wordObj = cfg.words[word] as WordOptions;
      if (wordObj.hasOwnProperty('words')) {
        // @ts-ignore: Old 'words' doesn't exist on Interface.
        wordObj.sub = wordObj.words[0] || '';
        // @ts-ignore: Old 'words' doesn't exist on Interface.
        delete wordObj.words;
      }
    });
  }

  // [2.1.4] - Update default sub values
  updateDefaultSubs() {
    const cfg = this.cfg;
    const updatedWords = {
      bastard: { original: 'jerk', update: 'idiot' },
      bitch: { original: 'jerk', update: 'bench' },
      cocksucker: { original: 'idiot', update: 'suckup' },
      cunt: { original: 'explative', update: 'expletive' },
      fag: { original: 'slur', update: 'gay' },
      faggot: { original: 'slur', update: 'gay' },
      fags: { original: 'slur', update: 'gays' },
      fuck: { original: 'fudge', update: 'freak' },
      goddammit: { original: 'goshdangit', update: 'dangit' },
      jackass: { original: 'idiot', update: 'jerk' },
      nigga: { original: 'ethnic slur', update: 'bruh' },
      nigger: { original: 'ethnic slur', update: 'man' },
      niggers: { original: 'ethnic slurs', update: 'people' },
      tits: { original: 'explative', update: 'chest' },
      twat: { original: 'explative', update: 'dumbo' },
    };

    Object.keys(updatedWords).forEach((updatedWord) => {
      if (cfg.words[updatedWord]) {
        const wordObj = cfg.words[updatedWord] as WordOptions;
        if (wordObj.sub == updatedWords[updatedWord].original) {
          wordObj.sub = updatedWords[updatedWord].update;
        }
      }
    });
  }
}