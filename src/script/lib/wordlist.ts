import Word from './word';
import Config from './config';
import Logger from './logger';
const logger = new Logger();

export default class Wordlist {
  all: Word[];
  list: string[];
  regExps: RegExp[];

  constructor(cfg: Config, wordlistId: number) {
    this.all = [];
    this.list = [];
    this.regExps = [];

    // Sort the words array by longest (most-specific) first
    const sorted = Object.keys(cfg.words).sort((a, b) => {
      return b.length - a.length;
    });

    // Process list of words
    sorted.forEach((wordStr) => {
      // wordlistId = 0 includes all words
      if (wordlistId === 0 || !Array.isArray(cfg.words[wordStr].lists) || cfg.words[wordStr].lists.includes(wordlistId)) {
        try {
          const word = new Word(wordStr, cfg.words[wordStr], cfg);
          this.list.push(wordStr);
          this.all.push(word);
          this.regExps.push(word.regExp);
        } catch (e) {
          logger.warn(`Failed to add word to wordlist: '${wordStr}'.`);
        }
      }
    });
  }

  find(value: string|number): Word {
    if (typeof value === 'string') {
      return this.all[this.list.indexOf(value)];
    } else if (typeof value === 'number') {
      return this.all[value];
    }
  }
}
