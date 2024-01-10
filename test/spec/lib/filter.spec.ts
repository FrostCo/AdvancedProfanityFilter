/* eslint-disable @typescript-eslint/naming-convention */
import { expect } from 'chai';
import Constants from '@APF/lib/constants';
import Config from '@APF/lib/config';
import Filter from '@APF/lib/filter';

const testWords = {
  'example': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, sub: 'demo', lists: [] },
  'placeholder': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.FALSE, sub: 'variable', lists: [] },
  'sample': { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.FALSE, sub: 'piece', lists: [] },
  'word': { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: Constants.TRUE, sub: 'idea', lists: [] },
};

describe('Filter', () => {
  describe('buildWordlist()', () => {
    it('should generate a sorted word list RegExp list', () => {
      const filter = new Filter;
      filter.cfg = new Config({
        words: Object.assign({}, testWords),
      });
      filter.init();
      expect(filter.wordlists[filter.wordlistId].list.length).to.equal(4);
      expect(filter.wordlists[filter.wordlistId].list).to.eql(['placeholder', 'example', 'sample', 'word']);
      expect(filter.wordlists[filter.wordlistId].regExps.length).to.equal(4);
    });
  });

  describe('init()', () => {
    it('should return RegExp list and be idempotent', () => {
      const filter = new Filter;
      filter.cfg = new Config({
        filterMethod: Constants.FILTER_METHODS.CENSOR,
        words: Object.assign({
          '^regexp.*?$': { matchMethod: Constants.MATCH_METHODS.REGEX, repeat: Constants.FALSE, sub: 'substitute' },
        }, testWords),
      });
      filter.init();
      expect(filter.wordlists[filter.wordlistId].regExps).to.eql([
        /^regexp.*?$/gi,
        /\bplaceholder\b/gi,
        /\be+x+a+m+p+l+e+\b/gi,
        /sample/gi,
        /\b[\w-]*w+o+r+d+[\w-]*\b/gi
      ]);
      filter.init();
      expect(filter.wordlists[filter.wordlistId].regExps).to.eql([
        /^regexp.*?$/gi,
        /\bplaceholder\b/gi,
        /\be+x+a+m+p+l+e+\b/gi,
        /sample/gi,
        /\b[\w-]*w+o+r+d+[\w-]*\b/gi
      ]);
    });

    it('should default to wordlist 0 when none configured', () => {
      const filter = new Filter;
      filter.cfg = new Config({
        filterMethod: Constants.FILTER_METHODS.CENSOR,
        words: Object.assign({}, testWords),
      });
      filter.wordlistId = undefined;
      expect(filter.wordlistId).to.be.undefined;
      filter.cfg.wordlistId = undefined;
      expect(filter.cfg.wordlistId).to.be.undefined;
      filter.init(undefined);
      expect(filter.wordlistId).to.equal(0);
    });
  });

  describe('rebuildWordlists()', () => {
    it('should rebuild all wordlists', () => {
      const filter = new Filter;
      filter.cfg = new Config({
        words: Object.assign({
          'book': { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: Constants.TRUE, sub: 'journal', lists: [1] },
        }, testWords),
      });
      filter.init();
      expect(Object.keys(filter.wordlists).length).to.equal(1);
      filter.buildWordlist(1);
      expect(Object.keys(filter.wordlists).length).to.equal(2);
      expect(Object.keys(filter.wordlists[1].all).length).to.equal(1);
      filter.cfg.words['food'] = { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: Constants.TRUE, sub: 'sustenance', lists: [1] };
      expect(Object.keys(filter.wordlists[0].all).length).to.equal(5);
      expect(Object.keys(filter.wordlists[1].all).length).to.equal(1);
      filter.rebuildWordlists();
      expect(Object.keys(filter.wordlists[0].all).length).to.equal(6);
      expect(Object.keys(filter.wordlists[1].all).length).to.equal(2);
      expect(filter.wordlists[1].find('food')).to.exist;
    });
  });

  describe('replaceText()', () => {
    describe('Censor', () => {
      describe('Exact', () => {
        it('preserveFirst', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '*',
            censorFixedLength: 0,
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: true,
            preserveLast: false,
            words: Object.assign({}, testWords),
          });
          filter.init();
          expect(filter.replaceText('this is a placeholder placeholder.')).to.equal('this is a p********** p**********.');
        });

        it('With (-) characters and no preserveFirst or preserveLast', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '-',
            censorFixedLength: 0,
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: false,
            preserveLast: false,
            words: Object.assign({}, testWords),
          });
          filter.init();
          expect(filter.replaceText('A cool example sentence.')).to.equal('A cool ------- sentence.');
        });

        it('Ending with punctuation', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '_',
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: false,
            words: {
              'A+': { matchMethod: Constants.MATCH_METHODS.EXACT },
            },
          });
          filter.init();
          expect(filter.replaceText('You deserve an A+')).to.equal('You deserve an __');
        });
      });

      describe('Partial', () => {
        it('With preserveFirst and preserveLast and update stats', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '*',
            censorFixedLength: 0,
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: true,
            preserveLast: true,
            words: Object.assign({}, testWords),
          });
          filter.init();
          expect(filter.counter).to.equal(0);
          expect(filter.replaceText('this sample is a pretty good sampler to sample.')).to.equal('this s****e is a pretty good s****er to s****e.');
          expect(filter.counter).to.be.above(0);
        });

        it('With separators', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '*',
            censorFixedLength: 0,
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: true,
            preserveLast: true,
            words: {
              pizza: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.TRUE },
            },
          });
          filter.init();
          expect(filter.replaceText('I love to eat P-I-Z-___Z---A!')).to.equal('I love to eat P************A!');
          expect(filter.replaceText('I love to eat P-I-Z-   Z---A!')).to.equal('I love to eat P************A!');
        });

        it('Ending with punctuation', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '_',
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: false,
            words:{
              'that+': { matchMethod: Constants.MATCH_METHODS.PARTIAL },
              'this!': { matchMethod: Constants.MATCH_METHODS.PARTIAL },
            },
          });
          filter.init();
          expect(filter.replaceText('I love allthat+')).to.equal('I love all_____');
          expect(filter.replaceText('I love allthis! Do you?')).to.equal('I love all_____ Do you?');
          expect(filter.replaceText('I love this! Do you?')).to.equal('I love _____ Do you?');
        });
      });

      describe('Whole', () => {
        it('With (_) characters and fixed length (3) and not update stats', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '_',
            censorFixedLength: 3,
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: false,
            preserveLast: false,
            words: Object.assign({}, testWords),
          });
          filter.init();
          expect(filter.counter).to.equal(0);
          expect(filter.replaceText('Words used to be okay, but now even a word is bad.', filter.wordlistId, null)).to.equal('___ used to be okay, but now even a ___ is bad.');
          expect(filter.counter).to.equal(0);
        });

        it('Ending with punctuation', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '_',
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: false,
            words: {
              'think+': { matchMethod: Constants.MATCH_METHODS.WHOLE },
              'this!': { matchMethod: Constants.MATCH_METHODS.WHOLE },
            },
          });
          filter.init();
          expect(filter.replaceText('What do you think+ about?')).to.equal('What do you ______ about?');
          expect(filter.replaceText('I love allthis! Do you?')).to.equal('I love ________ Do you?');
          expect(filter.replaceText('I love this! Do you?')).to.equal('I love _____ Do you?');
        });
      });

      describe('RegExp', () => {
        it('Should filter a RegExp and fixed length (5) with preserveLast', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '_',
            censorFixedLength: 5,
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: false,
            preserveLast: true,
            words: Object.assign({
              '^The': { matchMethod: Constants.MATCH_METHODS.REGEX, repeat: Constants.FALSE, sub: 'substitute' },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('The best things are always the best.')).to.equal('____e best things are always the best.');
        });
      });

      describe('allowlist', () => {
        it('case-sensitive exact match', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            words: {
              master: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, sub: 'padawan' },
            },
            wordAllowlist: ['Master'],
          });
          filter.init();
          expect(filter.replaceText('Can the master outsmart the Master?')).to.equal('Can the m***** outsmart the Master?');
          expect(filter.counter).to.equal(1);
        });

        it('case-sensitive partial match', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            words: {
              more: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE },
            },
            wordAllowlist: ['smore'],
          });
          filter.init();
          expect(filter.replaceText('Would you like smore smores?')).to.equal('Would you like smore sm***s?');
          expect(filter.counter).to.equal(1);
        });

        it('case-insensitive exact match', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            iWordAllowlist: ['master'],
            words: {
              master: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, sub: 'padawan' },
              the: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, sub: 'teh' },
            },
          });
          filter.init();
          expect(filter.replaceText('Can the master outsmart the Master?')).to.equal('Can t** master outsmart t** Master?');
          expect(filter.counter).to.equal(2);
        });

        it('case-sinsensitive partial match', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            iWordAllowlist: ['smore'],
            words: {
              more: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE },
            },
          });
          filter.init();
          expect(filter.replaceText('Would you like sMorE smores?')).to.equal('Would you like sMorE sm***s?');
          expect(filter.counter).to.equal(1);
        });
      });

      describe('Unicode characters', () => {
        it('preserveFirst', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '*',
            censorFixedLength: 0,
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: true,
            preserveLast: false,
            words: Object.assign({
              'врата': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, sub: 'door' },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('this even works on unicode words like врата, cool huh?')).to.equal('this even works on unicode w**** like в****, cool huh?');
        });

        it('preserveFirst and preserveLast', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '*',
            censorFixedLength: 0,
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: true,
            preserveLast: true,
            words: Object.assign({
              'котка': { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, sub: 'cat' },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('The коткаs in the hat')).to.equal('The к***аs in the hat');
        });

        it('With (_) characters and preserveFirst', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '_',
            censorFixedLength: 0,
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: true,
            preserveLast: false,
            words: Object.assign({
              'куче': { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: Constants.TRUE, sub: 'dog' },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('The bigкучеs ran around the yard.')).to.equal('The b_______ ran around the yard.');
        });

        it('With (*) characters', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '*',
            censorFixedLength: 0,
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: false,
            preserveLast: false,
            words: Object.assign({
              'словен': { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: Constants.FALSE },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('За пределами Словении этнические словенцы компактно')).to.equal('За пределами ******** этнические ******** компактно');
        });

        it('Should not filter an allowlisted word (partial match)', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '*',
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: false,
            preserveLast: false,
            words: Object.assign({
              'ловен': { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.FALSE },
            }, testWords),
            wordAllowlist: ['словенцы'],
          });
          filter.init();
          expect(filter.replaceText('За пределами Словении этнические словенцы компактно')).to.equal('За пределами С*****ии этнические словенцы компактно');
          expect(filter.counter).to.equal(1);
        });

        it('censor unicode character: ぅ', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '*',
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: false,
            preserveLast: false,
            words: Object.assign({
              'ぅ': { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.FALSE },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('ぁ あ ぃ い ぅ')).to.equal('ぁ あ ぃ い *');
          expect(filter.counter).to.equal(1);
        });

        it('censor emoji in sentence', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '*',
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: false,
            preserveLast: false,
            words: Object.assign({
              '🍕': { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.FALSE },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('I love to eat 🍕 so much!')).to.equal('I love to eat * so much!');
          expect(filter.counter).to.equal(1);
        });

        it('censor just an emoji', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '*',
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: false,
            preserveLast: false,
            words: Object.assign({
              '🔧': { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.FALSE },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('🔧')).to.equal('*');
          expect(filter.counter).to.equal(1);
        });

        it('censor just an emoji wtih fixed length', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '*',
            censorFixedLength: 3,
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            preserveFirst: false,
            preserveLast: false,
            words: Object.assign({
              '🔧': { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.FALSE },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('🔧')).to.equal('***');
          expect(filter.counter).to.equal(1);
        });

        it('censor an emoji and preserve unfiltered emojis', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '*',
            filterMethod: Constants.FILTER_METHODS.CENSOR,
            censorFixedLength: 2,
            preserveFirst: true,
            preserveLast: true,
            words: Object.assign({
              '❤️': { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.FALSE },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('ℹ️❤️🍕!')).to.equal('ℹ️**🍕!');
          expect(filter.counter).to.equal(1);
        });
      });
    });

    describe('Substitute', () => {
      describe('Exact', () => {
        it('Marked and preserveCase', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            preserveCase: true,
            substitutionMark: true,
            words: Object.assign({}, testWords),
          });
          filter.init();
          expect(filter.replaceText('I love having good examples as an Example.')).to.equal('I love having good examples as an [Demo].');
        });

        it('Marked and preserveCase with repeated characters', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            preserveCase: true,
            substitutionMark: true,
            words: Object.assign({}, testWords),
          });
          filter.init();
          expect(filter.replaceText('I love having good examples as an Exxaammppllee.')).to.equal('I love having good examples as an [Demo].');
        });

        it('Ending with punctuation', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            preserveCase: true,
            substitutionMark: false,
            words: {
              '!again+': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.FALSE, sub: 'wow!' },
              '!another!': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.FALSE, sub: '$znother#' },
              '!bang': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, sub: '!poof' },
              'this!': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.FALSE, sub: 'that!' },
            },
          });
          filter.init();
          expect(filter.replaceText('I love This! Do you?')).to.equal('I love That! Do you?');
          expect(filter.replaceText('I love this!')).to.equal('I love that!');
          expect(filter.replaceText('Go out with a !baangg')).to.equal('Go out with a !poof');
          expect(filter.replaceText('Go out with a !Bang!')).to.equal('Go out with a !Bang!');
          expect(filter.replaceText('!ANOTHER! so cool!')).to.equal('$ZNOTHER# so cool!');
          expect(filter.replaceText('ANOTHER! !again+')).to.equal('ANOTHER! wow!');
        });

        it('Begin/end with dashes (-)', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            preserveCase: true,
            substitutionMark: false,
            words: {
              '-this-': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.FALSE, sub: 'that' },
              '-this': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.FALSE, sub: 'that' },
              'this-': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, sub: 'that' },
            },
          });
          filter.init();
          expect(filter.replaceText('Can you believe -this?')).to.equal('Can you believe that?');
          expect(filter.replaceText('So crazy, this- thing')).to.equal('So crazy, that thing');
          expect(filter.replaceText('What is -this-?!')).to.equal('What is that?!');
        });

        describe('Words and phrases with both case sensitivities', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            preserveCase: true,
            substitutionMark: false,
            words: {
              'a phrase too': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, case: Constants.TRUE, sub: 'mULTIPLE wORDS tOO', lists: [] },
              'corn on the cob': { matchMethod: Constants.MATCH_METHODS.EXACT, sub: 'corn', lists: [] },
              'oneword': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, case: Constants.TRUE, sub: 'wOrD', lists: [] },
              'pie': { matchMethod: Constants.MATCH_METHODS.EXACT, sub: 'ice cream', lists: [] },
              'pizza': { matchMethod: Constants.MATCH_METHODS.EXACT, sub: 'chocolate', lists: [] },
              "here's a little song i wrote": { matchMethod: Constants.MATCH_METHODS.EXACT, sub: 'my gift is my song', lists: [] },
            },
          });
          filter.init();

          it('Word with case sensitivity on', () => {
            expect(filter.replaceText('What is the oneword?')).to.equal('What is the wOrD?');
            expect(filter.replaceText('What is the oneword?')).to.equal('What is the wOrD?');
          });

          it('Word with case sensitivity off (preserveCase on)', () => {
            expect(filter.replaceText('Pizza is the best!')).to.equal('Chocolate is the best!');
          });

          it('Word with case sensitivity off (preserveCase on)', () => {
            expect(filter.replaceText('Pizza is the best!')).to.equal('Chocolate is the best!');
          });

          it('Phrase with case sensitivity on', () => {
            expect(filter.replaceText('I can filter and capitalize A Phrase Too!')).to.equal('I can filter and capitalize mULTIPLE wORDS tOO!');
            expect(filter.replaceText('I can filter and capitalize A Phraseeeee Too!')).to.equal('I can filter and capitalize mULTIPLE wORDS tOO!');
          });

          it('Phrase with case sensitivity off (preserveCase on)', () => {
            expect(filter.replaceText("Here's A Little Song I Wrote, you might want to sing it note for note")).to.equal('My Gift Is My Song, you might want to sing it note for note');
            expect(filter.replaceText("Here's a Little Song I Wrote, you might want to sing it note for note")).to.equal('My gift is my song, you might want to sing it note for note');
            expect(filter.replaceText("here's a little song i wrote, you might want to sing it note for note")).to.equal('my gift is my song, you might want to sing it note for note');
            expect(filter.replaceText("HERE'S A LITTLE SONG I WROTE, you might want to sing it note for note")).to.equal('MY GIFT IS MY SONG, you might want to sing it note for note');
          });

          it('Word to substitution phrase with case sensitivity off (preserveCase on)', () => {
            expect(filter.replaceText('Do you like to eat pie?')).to.equal('Do you like to eat ice cream?');
            expect(filter.replaceText('Do you like to eat Pie?')).to.equal('Do you like to eat Ice Cream?');
            expect(filter.replaceText('Do you like to eat PIE?')).to.equal('Do you like to eat ICE CREAM?');
          });

          it('Phrase to substitution word with case sensitivity off (preserveCase on)', () => {
            expect(filter.replaceText('Do you like to eat corn on the cob?')).to.equal('Do you like to eat corn?');
            expect(filter.replaceText('Do you like to eat corn On The Cob?')).to.equal('Do you like to eat corn?');
            expect(filter.replaceText('Do you like to eat Corn on the cob?')).to.equal('Do you like to eat Corn?');
            expect(filter.replaceText('Do you like to eat Corn On The Cob?')).to.equal('Do you like to eat Corn?');
            expect(filter.replaceText('Do you like to eat CORN ON THE COB?')).to.equal('Do you like to eat CORN?');
          });
        });
      });

      describe('Partial', () => {
        it('Not marked and preserveCase', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            preserveCase: true,
            substitutionMark: false,
            words: Object.assign({}, testWords),
          });
          filter.init();
          expect(filter.replaceText('This Sample is a pretty good sampler to sample.')).to.equal('This Piece is a pretty good piecer to piece.');
        });

        it('Default substitution not marked and preserveCase', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            defaultSubstitution: 'censored',
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            preserveCase: true,
            substitutionMark: false,
            words: Object.assign({}, testWords),
          });
          filter.cfg.words['this'] = { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, sub: '' };
          filter.init();
          expect(filter.replaceText('This Sample is a pretty good sampler to sample.')).to.equal('Censored Piece is a pretty good piecer to piece.');
        });

        it('Not marked, not repeated, and preserveCase and update stats', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            preserveCase: true,
            substitutionMark: false,
            words: Object.assign({}, testWords),
          });
          filter.init();
          expect(filter.counter).to.equal(0);
          expect(filter.replaceText('This Sample is a pretty good sampler to saammppllee.')).to.equal('This Piece is a pretty good piecer to saammppllee.');
          expect(filter.counter).to.be.above(0);
        });

        it('Marked and not preserveCase and not update stats', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            preserveCase: false,
            substitutionMark: true,
            words: Object.assign({}, testWords),
          });
          filter.init();
          expect(filter.counter).to.equal(0);
          expect(filter.replaceText('This Sample is a pretty good sampler to sample.', filter.wordlistId, null)).to.equal('This [piece] is a pretty good [piece]r to [piece].');
          expect(filter.counter).to.equal(0);
        });

        it('Match separators', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '*',
            censorFixedLength: 0,
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            preserveFirst: true,
            preserveLast: true,
            words: {
              pizza: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.TRUE, sub: 'pie' },
            },
          });
          filter.init();
          expect(filter.replaceText('I love to eat P-I-Z-Z-A!')).to.equal('I love to eat PIE!');
          expect(filter.replaceText('I love to eat P-I-Z-___Z---A!')).to.equal('I love to eat PIE!');
          expect(filter.replaceText('I love to eat P-I-Z_   Z---A!')).to.equal('I love to eat PIE!');
        });

        it('Randomizes substitutions (separated by ";;")', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            words: {
              fast: { matchMethod: Constants.MATCH_METHODS.PARTIAL, separators: Constants.TRUE, sub: 'rapid;;speedy;;quick' },
            },
          });
          filter.init();
          const results = new Set();
          for (let i = 0; i < 100; i++) {
            if (results.size == 3) break;

            results.add(filter.replaceText('The Flash is really fast!', filter.wordlistId));
          }

          expect(results.size).to.equal(3);
        });
      });

      describe('RegExp', () => {
        it('Should filter a RegExp with capture groups', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            words: Object.assign({
              'c(a|u)t': { matchMethod: Constants.MATCH_METHODS.REGEX, repeat: Constants.FALSE, sub: 'bit' },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('Have you ever been cut by a Cat?')).to.equal('Have you ever been bit by a Bit?');
        });

        it('Should support backreferences in replace', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            words: Object.assign({
              'pee([ed]{0,2}[ ]?\\w*?) off': { matchMethod: Constants.MATCH_METHODS.REGEX, repeat: Constants.FALSE, sub: 'tick\\1 off' },
              'scare([ ]?\\w*) off': { matchMethod: Constants.MATCH_METHODS.REGEX, repeat: Constants.FALSE, sub: 'spook\\1 off' },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('Try not to pee John off.')).to.equal('Try not to tick John off.');
          expect(filter.replaceText('Try not to scare John off.')).to.equal('Try not to spook John off.');
        });

        it('Should support substitutionMark with backreferences in replace', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            substitutionMark: Constants.TRUE,
            words: {
              '(a)': { matchMethod: Constants.MATCH_METHODS.REGEX, repeat: Constants.FALSE, sub: 'you typed: \\1' },
              '(b)': { matchMethod: Constants.MATCH_METHODS.REGEX, repeat: Constants.FALSE, sub: 'you typed: \\1' },
            },
          });
          filter.init();
          expect(filter.replaceText('a')).to.equal('[you typed: a]');
          expect(filter.replaceText('B')).to.equal('[you typed: B]');
        });

        it('Should not preserveCase when false using backreferences in replace', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            preserveCase: false,
            words: {
              '(a)': { matchMethod: Constants.MATCH_METHODS.REGEX, repeat: Constants.FALSE, sub: 'you typed: \\1' },
              '(b)': { matchMethod: Constants.MATCH_METHODS.REGEX, repeat: Constants.FALSE, sub: 'you typed: \\1' },
            },
          });
          filter.init();
          expect(filter.replaceText('a')).to.equal('you typed: a');
          expect(filter.replaceText('B')).to.equal('you typed: b');
        });
      });

      describe('allowlist', () => {
        it('case-sensitive exact match', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            preserveCase: true,
            substitutionMark: false,
            words: {
              master: { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: Constants.TRUE, sub: 'padawan' },
            },
            wordAllowlist: ['Master'],
          });
          filter.init();
          expect(filter.replaceText('Can the master outsmart the Master?')).to.equal('Can the padawan outsmart the Master?');
          expect(filter.counter).to.equal(1);
        });

        it('case insensitive exact match', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            iWordAllowlist: ['master'],
            words: {
              master: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, sub: 'padawan' },
              the: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, sub: 'teh' },
            },
          });
          filter.init();
          expect(filter.replaceText('Can the master outsmart the Master?')).to.equal('Can teh master outsmart teh Master?');
          expect(filter.counter).to.equal(2);
        });

        it('case insensitive partial match', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            iWordAllowlist: ['smore'],
            words: {
              more: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, sub: 'less' },
            },
          });
          filter.init();
          expect(filter.replaceText('Would you like sMorE smores?')).to.equal('Would you like sMorE slesss?');
          expect(filter.counter).to.equal(1);
        });
      });

      describe('Unicode characters', () => {
        it('Exact word with substitions marked and preserveCase with repeated characters', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            preserveCase: true,
            substitutionMark: true,
            words: Object.assign({
              'врата': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, sub: 'door' },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('this even works on unicode WORDS like Врата, cool huh?')).to.equal('this even works on unicode [IDEA] like [Door], cool huh?');
        });
      });
    });

    describe('Remove', () => {
      describe('Exact', () => {
        it('Update stats', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.REMOVE,
            words: Object.assign({}, testWords),
          });
          filter.init();
          expect(filter.counter).to.equal(0);
          expect(filter.replaceText('A cool, example sentence.')).to.equal('A cool, sentence.');
          expect(filter.counter).to.be.above(0);
        });

        it('Ending with punctuation', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.REMOVE,
            words: {
              'this!': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.FALSE },
            },
          });
          filter.init();
          expect(filter.replaceText('I love This! Do you?')).to.equal('I love Do you?');
          expect(filter.replaceText('I love this!')).to.equal('I love');
        });

        it('With separators', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            censorCharacter: '*',
            censorFixedLength: 0,
            filterMethod: Constants.FILTER_METHODS.REMOVE,
            preserveFirst: true,
            preserveLast: true,
            words: {
              pizza: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, separators: Constants.TRUE },
            },
          });
          filter.init();
          expect(filter.replaceText('I love to eat PPPPPP-I-----ZZZZZZZZZZZ__A!')).to.equal('I love to eat!');
        });
      });

      describe('Partial', () => {
        it('Not update stats', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.REMOVE,
            words: Object.assign({}, testWords),
          });
          filter.init();
          expect(filter.counter).to.equal(0);
          expect(filter.replaceText('This Sample is a pretty good sampler to sample.', filter.wordlistId, null)).to.equal('This is a pretty good to.');
          expect(filter.counter).to.equal(0);
        });

        it('Ending with punctuation', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.REMOVE,
            words: {
              'this!': { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.FALSE },
            }
          });
          filter.init();
          expect(filter.replaceText('I love allthis! Do you?')).to.equal('I love Do you?');
          expect(filter.replaceText('I love this! Do you?')).to.equal('I love Do you?');
        });

        it('Ending with colon', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.REMOVE,
            words: {
              'app. rate:': { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.FALSE },
            },
          });
          filter.init();
          expect(filter.replaceText('app. rate:')).to.equal('');
          expect(filter.replaceText('app. rate: 5.93%')).to.equal('5.93%');
        });
      });

      it('Should filter a RegExp', () => {
        const filter = new Filter;
        filter.cfg = new Config({
          filterMethod: Constants.FILTER_METHODS.REMOVE,
          words: Object.assign({
            'this and everything after.*$': { matchMethod: Constants.MATCH_METHODS.REGEX, repeat: Constants.FALSE, sub: 'substitute' },
          }, testWords),
        });
        filter.init();
        expect(filter.replaceText('Have you ever done this and everything after it?')).to.equal('Have you ever done ');
      });

      describe('allowlist', () => {
        it('case-sensitive exact match', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.REMOVE,
            words: {
              master: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, sub: 'padawan' },
            },
            wordAllowlist: ['Master'],
          });
          filter.init();
          expect(filter.replaceText('Can the master outsmart the Master?')).to.equal('Can the outsmart the Master?');
          expect(filter.counter).to.equal(1);
        });

        it('case-sensitive partial match', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.REMOVE,
            words: {
              more: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE },
            },
            wordAllowlist: ['smores'],
          });
          filter.init();
          expect(filter.replaceText('Would you like smore smores?')).to.equal('Would you like smores?');
          expect(filter.counter).to.equal(1);
        });

        it('case-insensitive exact match)', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.REMOVE,
            iWordAllowlist: ['pie'],
            words: {
              pie: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, sub: 'cake' },
            },
          });
          filter.init();
          expect(filter.replaceText('Apple pie is the best PIE!')).to.equal('Apple pie is the best PIE!');
          expect(filter.counter).to.equal(0);
        });
      });

      describe('Unicode characters', () => {
        it('Exact word', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.REMOVE,
            words: Object.assign({
              'врата': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, sub: 'door' },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('This even works on врата. cool huh?')).to.equal('This even works on. cool huh?');
          expect(filter.replaceText('This even works on врата, cool huh?')).to.equal('This even works on, cool huh?');
          expect(filter.replaceText('This even works on врата?')).to.equal('This even works on?');
        });

        it('Partial word', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.REMOVE,
            words: Object.assign({
              'врата': { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, sub: 'door' },
            }, testWords),
          });
          filter.init();
          expect(filter.replaceText('This even works on with-врата. Cool huh?')).to.equal('This even works on. Cool huh?');
          expect(filter.replaceText('The вратаs in the hat')).to.equal('The in the hat');
          expect(filter.replaceText('вратаs. in the hat')).to.equal('. in the hat');
          expect(filter.replaceText('вратаs')).to.equal('');
        });
      });
    });
  });

  describe('replaceTextResult()', () => {
    it('should generate a result object when filtering', () => {
      const filter = new Filter;
      filter.cfg = new Config({
        words: Object.assign({}, testWords),
      });
      filter.init();
      const string = 'this is my example';
      const result = filter.replaceTextResult(string);
      expect(result.filtered).to.equal('this is my demo');
      expect(result.original).to.equal(string);
      expect(result.modified).to.equal(true);
    });

    it('should generate a result object when not filtering', () => {
      const filter = new Filter;
      filter.cfg = new Config({
        words: Object.assign({}, testWords),
      });
      filter.init();
      const string = 'this is my story';
      const result = filter.replaceTextResult(string);
      expect(result.filtered).to.equal(string);
      expect(result.original).to.equal(string);
      expect(result.modified).to.equal(false);
    });
  });
});
