import Constants from './Constants';
import Word from './Word';
import Config from './Config';
import Logger from './Logger';

const logger = new Logger('Wordlist');

export default class Wordlist {
  all: Word[];
  list: string[];
  regExps: RegExp[];

  static get log() {
    return logger;
  }

  //#region Class reference helpers
  // Can be overridden in children classes
  get Class() {
    return this.constructor as typeof Wordlist;
  }
  //#endregion

  constructor(cfg: Config, wordlistId: number) {
    this.all = [];
    this.list = [];
    this.regExps = [];
    this.log.setLevel(cfg.loggingLevel);

    // Sort the words array by longest (most-specific) first
    const sorted = Object.keys(cfg.words).sort((a, b) => {
      return b.length - a.length;
    });

    // Process list of words
    sorted.forEach((wordStr) => {
      if (
        wordlistId === Constants.ALL_WORDS_WORDLIST_ID ||
        !Array.isArray(cfg.words[wordStr].lists) ||
        cfg.words[wordStr].lists.includes(wordlistId)
      ) {
        try {
          const word = new Word(wordStr, cfg.words[wordStr], cfg);
          this.list.push(wordStr);
          this.all.push(word);
          this.regExps.push(word.regExp);
        } catch (err) {
          this.log.warn(`Failed to add '${wordStr}' to wordlist.`, err);
        }
      }
    });
  }

  get log() {
    return this.Class.log;
  }

  find(value: string | number): Word {
    if (typeof value === 'string') {
      return this.all[this.list.indexOf(value)];
    } else if (typeof value === 'number') {
      return this.all[value];
    }
  }
}
