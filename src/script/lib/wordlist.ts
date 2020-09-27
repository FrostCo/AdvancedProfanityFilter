import Word from './word';
import Config from './config';

export default class Wordlist {
  all: Word[];
  list: string[];
  regExps: RegExp[];

  constructor(cfg: Config, wordlistId: number) {
    let self = this;
    this.all = [];
    this.list = [];
    this.regExps = [];

    // Sort the words array by longest (most-specific) first
    let sorted = Object.keys(cfg.words).sort((a, b) => {
      return b.length - a.length;
    });

    // Process list of words
    sorted.forEach(wordStr => {
      // wordlistId = 0 includes all words
      if (wordlistId === 0 || !Array.isArray(cfg.words[wordStr].lists) || cfg.words[wordStr].lists.includes(wordlistId)) {
        let word;
        try {
          word = new Word(wordStr, cfg.words[wordStr], cfg);
          self.list.push(wordStr);
          self.all.push(word);
          self.regExps.push(word.regExp);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(`APF: failed to add word: '${wordStr}'`);
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
