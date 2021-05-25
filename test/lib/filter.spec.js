import { expect } from 'chai';
import Constants from '../built/lib/constants';
import Config from '../built/lib/config';
import Filter from '../built/lib/filter';

const testWords = {
  'example': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, sub: 'demo', lists: [] },
  'placeholder': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: false, sub: 'variable', lists: [] },
  'sample': { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: false, sub: 'piece', lists: [] },
  'word': { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: true, sub: 'idea', lists: [] }
};

describe('Filter', () => {
  describe('buildWordlist()', () => {
    it('should generate a sorted word list RegExp list', () => {
      const filter = new Filter;
      filter.cfg = new Config({ words: Object.assign({}, testWords) });
      filter.init();
      expect(filter.wordlists[filter.wordlistId].list.length).to.equal(4);
      expect(filter.wordlists[filter.wordlistId].list).to.eql(['placeholder', 'example', 'sample', 'word']);
      expect(filter.wordlists[filter.wordlistId].regExps.length).to.equal(4);
    });
  });

  describe('init()', () => {
    it('should return RegExp list and be idempotent', () => {
      const filter = new Filter;
      filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.CENSOR });
      filter.cfg = new Config({
        filterMethod: Constants.FILTER_METHODS.CENSOR,
        words: Object.assign({}, testWords, { '^regexp.*?$': { matchMethod: Constants.MATCH_METHODS.REGEX, repeat: false, sub: 'substitute' } })
      });
      filter.init();
      expect(filter.wordlists[filter.wordlistId].regExps).to.eql([
        /\bplaceholder\b/gi,
        /^regexp.*?$/gi,
        /\be+x+a+m+p+l+e+\b/gi,
        /sample/gi,
        /\b[\w-]*w+o+r+d+[\w-]*\b/gi
      ]);
      filter.init();
      expect(filter.wordlists[filter.wordlistId].regExps).to.eql([
        /\bplaceholder\b/gi,
        /^regexp.*?$/gi,
        /\be+x+a+m+p+l+e+\b/gi,
        /sample/gi,
        /\b[\w-]*w+o+r+d+[\w-]*\b/gi
      ]);
    });

    it('should default to wordlist 0 when none configured', () => {
      const filter = new Filter;
      filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.CENSOR });
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
      filter.cfg = new Config({ words: Object.assign({}, testWords) });
      filter.cfg.words['book'] = { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: true, sub: 'journal', lists: [1] };
      filter.init();
      expect(Object.keys(filter.wordlists).length).to.equal(1);
      filter.buildWordlist(1);
      expect(Object.keys(filter.wordlists).length).to.equal(2);
      expect(Object.keys(filter.wordlists[1].all).length).to.equal(1);
      filter.cfg.words['food'] = { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: true, sub: 'sustenance', lists: [1] };
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
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.CENSOR, censorCharacter: '*', censorFixedLength: 0, preserveFirst: true, preserveLast: false });
          filter.init();
          expect(filter.replaceText('this is a placeholder placeholder.')).to.equal('this is a p********** p**********.');
        });

        it('With (-) characters and no preserveFirst or preserveLast', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.CENSOR, censorCharacter: '-', censorFixedLength: 0, preserveFirst: false, preserveLast: false });
          filter.init();
          expect(filter.replaceText('A cool example sentence.')).to.equal('A cool ------- sentence.');
        });
      });

      describe('Partial', () => {
        it('With preserveFirst and preserveLast and update stats', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.CENSOR, censorCharacter: '*', censorFixedLength: 0, preserveFirst: true, preserveLast: true });
          filter.init();
          expect(filter.counter).to.equal(0);
          expect(filter.replaceText('this sample is a pretty good sampler to sample.')).to.equal('this s****e is a pretty good s****er to s****e.');
          expect(filter.counter).to.be.above(0);
        });

        it('With separators', () => {
          const filter = new Filter;
          const words = { pizza: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: true } };
          filter.cfg = new Config({ words: words, filterMethod: Constants.FILTER_METHODS.CENSOR, censorCharacter: '*', censorFixedLength: 0, preserveFirst: true, preserveLast: true });
          filter.init();
          expect(filter.replaceText('I love to eat P-I-Z-___Z---A!')).to.equal('I love to eat P************A!');
          expect(filter.replaceText('I love to eat P-I-Z-   Z---A!')).to.equal('I love to eat P************A!');
        });

        it('Ending with punctuation', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: { 'this!': { matchMethod: Constants.MATCH_METHODS.PARTIAL } }, filterMethod: Constants.FILTER_METHODS.CENSOR, censorCharacter: '_', preserveFirst: false });
          filter.init();
          expect(filter.replaceText('I love allthis! Do you?')).to.equal('I love all_____ Do you?');
          expect(filter.replaceText('I love this! Do you?')).to.equal('I love _____ Do you?');
        });
      });

      describe('Whole', () => {
        it('With (_) characters and fixed length (3) and not update stats', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.CENSOR, censorCharacter: '_', censorFixedLength: 3, preserveFirst: false, preserveLast: false });
          filter.init();
          expect(filter.counter).to.equal(0);
          expect(filter.replaceText('Words used to be okay, but now even a word is bad.', filter.wordlistId, false)).to.equal('___ used to be okay, but now even a ___ is bad.');
          expect(filter.counter).to.equal(0);
        });

        it('Ending with punctuation', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: { 'this!': { matchMethod: Constants.MATCH_METHODS.WHOLE } }, filterMethod: Constants.FILTER_METHODS.CENSOR, censorCharacter: '_', preserveFirst: false });
          filter.init();
          expect(filter.replaceText('I love allthis! Do you?')).to.equal('I love ________ Do you?');
          expect(filter.replaceText('I love this! Do you?')).to.equal('I love _____ Do you?');
        });
      });

      describe('RegExp', () => {
        it('Should filter a RegExp and fixed length (5) with preserveLast', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.CENSOR, censorCharacter: '_', censorFixedLength: 5, preserveFirst: false, preserveLast: true });
          filter.cfg.words['^The'] = { matchMethod: Constants.MATCH_METHODS.REGEX, repeat: false, sub: 'substitute' };
          filter.init();
          expect(filter.replaceText('The best things are always the best.')).to.equal('____e best things are always the best.');
        });
      });

      describe('whitelist', () => {
        it('case-sensitive exact match', () => {
          const filter = new Filter;
          const words = { master: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, sub: 'padawan' } };
          filter.cfg = new Config({ words: Object.assign({}, words), filterMethod: Constants.FILTER_METHODS.CENSOR, wordWhitelist: ['Master'] });
          filter.init();
          expect(filter.replaceText('Can the master outsmart the Master?')).to.equal('Can the m***** outsmart the Master?');
          expect(filter.counter).to.equal(1);
        });

        it('case-sensitive partial match', () => {
          const filter = new Filter;
          const words = { more: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true } };
          filter.cfg = new Config({ words: Object.assign({}, words), filterMethod: Constants.FILTER_METHODS.CENSOR, wordWhitelist: ['smore'] });
          filter.init();
          expect(filter.replaceText('Would you like smore smores?')).to.equal('Would you like smore sm***s?');
          expect(filter.counter).to.equal(1);
        });

        it('case-insensitive exact match', () => {
          const filter = new Filter;
          const words = {
            master: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, sub: 'padawan' },
            the: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, sub: 'teh' }
          };
          filter.cfg = new Config({ words: Object.assign({}, words), filterMethod: Constants.FILTER_METHODS.CENSOR, iWordWhitelist: ['master'] });
          filter.init();
          expect(filter.replaceText('Can the master outsmart the Master?')).to.equal('Can t** master outsmart t** Master?');
          expect(filter.counter).to.equal(2);
        });

        it('case-sinsensitive partial match', () => {
          const filter = new Filter;
          const words = { more: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true } };
          filter.cfg = new Config({ words: Object.assign({}, words), filterMethod: Constants.FILTER_METHODS.CENSOR, iWordWhitelist: ['smore'] });
          filter.init();
          expect(filter.replaceText('Would you like sMorE smores?')).to.equal('Would you like sMorE sm***s?');
          expect(filter.counter).to.equal(1);
        });
      });

      describe('Unicode characters', () => {
        it('preserveFirst', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.CENSOR, censorCharacter: '*', censorFixedLength: 0, preserveFirst: true, preserveLast: false });
          filter.cfg.words['врата'] = { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, sub: 'door' };
          filter.init();
          expect(filter.replaceText('this even works on unicode words like врата, cool huh?')).to.equal('this even works on unicode w**** like в****, cool huh?');
        });

        it('preserveFirst and preserveLast', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.CENSOR, censorCharacter: '*', censorFixedLength: 0, preserveFirst: true, preserveLast: true });
          filter.cfg.words['котка'] = { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, sub: 'cat' };
          filter.init();
          expect(filter.replaceText('The коткаs in the hat')).to.equal('The к***аs in the hat');
        });

        it('With (_) characters and preserveFirst', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.CENSOR, censorCharacter: '_', censorFixedLength: 0, preserveFirst: true, preserveLast: false });
          filter.cfg.words['куче'] = { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: true, sub: 'dog' };
          filter.init();
          expect(filter.replaceText('The bigкучеs ran around the yard.')).to.equal('The b_______ ran around the yard.');
        });

        it('With (*) characters', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.CENSOR, censorCharacter: '*', censorFixedLength: 0, preserveFirst: false, preserveLast: false });
          filter.cfg.words['словен'] = { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: false };
          filter.init();
          expect(filter.replaceText('За пределами Словении этнические словенцы компактно')).to.equal('За пределами ******** этнические ******** компактно');
        });

        it('Should not filter a whitelisted word (partial match)', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.CENSOR, censorCharacter: '*', preserveFirst: false, preserveLast: false, wordWhitelist: ['словенцы'] });
          filter.cfg.words['ловен'] = { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: false };
          filter.init();
          expect(filter.replaceText('За пределами Словении этнические словенцы компактно')).to.equal('За пределами С*****ии этнические словенцы компактно');
          expect(filter.counter).to.equal(1);
        });
      });
    });

    describe('Substitute', () => {
      describe('Exact', () => {
        it('Marked and preserveCase', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.SUBSTITUTE, substitutionMark: true, preserveCase: true });
          filter.init();
          expect(filter.replaceText('I love having good examples as an Example.')).to.equal('I love having good examples as an [Demo].');
        });

        it('Marked and preserveCase with repeated characters', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.SUBSTITUTE, substitutionMark: true, preserveCase: true });
          filter.init();
          expect(filter.replaceText('I love having good examples as an Exxaammppllee.')).to.equal('I love having good examples as an [Demo].');
        });

        it('Ending with punctuation', () => {
          const filter = new Filter;
          filter.cfg = new Config({
            filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
            substitutionMark: false,
            preserveCase: true,
            words: {
              'this!': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: false, sub: 'that!' },
              '!bang': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, sub: '!poof' },
              '!another!': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: false, sub: '$znother#' }
            },
          });
          filter.init();
          expect(filter.replaceText('I love This! Do you?')).to.equal('I love That! Do you?');
          expect(filter.replaceText('I love this!')).to.equal('I love that!');
          expect(filter.replaceText('Go out with a !baangg')).to.equal('Go out with a !poof');
          expect(filter.replaceText('Go out with a !Bang!')).to.equal('Go out with a !Bang!');
          expect(filter.replaceText('!ANOTHER! so cool!')).to.equal('$ZNOTHER# so cool!');
        });
      });

      describe('Partial', () => {
        it('Not marked and preserveCase', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.SUBSTITUTE, substitutionMark: false, preserveCase: true });
          filter.init();
          expect(filter.replaceText('This Sample is a pretty good sampler to sample.')).to.equal('This Piece is a pretty good piecer to piece.');
        });

        it('Default substitution not marked and preserveCase', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), defaultSubstitution: 'censored', filterMethod: Constants.FILTER_METHODS.SUBSTITUTE, substitutionMark: false, preserveCase: true });
          filter.cfg.words['this'] = { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, sub: '' };
          filter.init();
          expect(filter.replaceText('This Sample is a pretty good sampler to sample.')).to.equal('Censored Piece is a pretty good piecer to piece.');
        });

        it('Not marked, not repeated, and preserveCase and update stats', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.SUBSTITUTE, substitutionMark: false, preserveCase: true });
          filter.init();
          expect(filter.counter).to.equal(0);
          expect(filter.replaceText('This Sample is a pretty good sampler to saammppllee.')).to.equal('This Piece is a pretty good piecer to saammppllee.');
          expect(filter.counter).to.be.above(0);
        });

        it('Marked and not preserveCase and not update stats', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.SUBSTITUTE, substitutionMark: true, preserveCase: false });
          filter.init();
          expect(filter.counter).to.equal(0);
          expect(filter.replaceText('This Sample is a pretty good sampler to sample.', filter.wordlistId, false)).to.equal('This [piece] is a pretty good [piece]r to [piece].');
          expect(filter.counter).to.equal(0);
        });

        it('Match separators', () => {
          const filter = new Filter;
          const words = { pizza: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: true, sub: 'pie' } };
          filter.cfg = new Config({ words: words, filterMethod: Constants.FILTER_METHODS.SUBSTITUTE, censorCharacter: '*', censorFixedLength: 0, preserveFirst: true, preserveLast: true });
          filter.init();
          expect(filter.replaceText('I love to eat P-I-Z-Z-A!')).to.equal('I love to eat PIE!');
          expect(filter.replaceText('I love to eat P-I-Z-___Z---A!')).to.equal('I love to eat PIE!');
          expect(filter.replaceText('I love to eat P-I-Z_   Z---A!')).to.equal('I love to eat PIE!');
        });
      });

      describe('RegExp', () => {
        it('Should filter a RegExp with capture groups', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.SUBSTITUTE });
          filter.cfg.words['c(a|u)t'] = { matchMethod: Constants.MATCH_METHODS.REGEX, repeat: false, sub: 'bit' };
          filter.init();
          expect(filter.replaceText('Have you ever been cut by a Cat?')).to.equal('Have you ever been bit by a Bit?');
        });
      });

      describe('whitelist', () => {
        it('case-sensitive exact match', () => {
          const filter = new Filter;
          const words = { master: { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: true, sub: 'padawan' } };
          filter.cfg = new Config({ words: Object.assign({}, words), filterMethod: Constants.FILTER_METHODS.SUBSTITUTE, substitutionMark: false, preserveCase: true, wordWhitelist: ['Master'] });
          filter.init();
          expect(filter.replaceText('Can the master outsmart the Master?')).to.equal('Can the padawan outsmart the Master?');
          expect(filter.counter).to.equal(1);
        });

        it('case insensitive exact match', () => {
          const filter = new Filter;
          const words = {
            master: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, sub: 'padawan' },
            the: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, sub: 'teh' }
          };
          filter.cfg = new Config({ words: Object.assign({}, words), filterMethod: Constants.FILTER_METHODS.SUBSTITUTE, iWordWhitelist: ['master'] });
          filter.init();
          expect(filter.replaceText('Can the master outsmart the Master?')).to.equal('Can teh master outsmart teh Master?');
          expect(filter.counter).to.equal(2);
        });

        it('case insensitive partial match', () => {
          const filter = new Filter;
          const words = { more: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, sub: 'less' } };
          filter.cfg = new Config({ words: Object.assign({}, words), filterMethod: Constants.FILTER_METHODS.SUBSTITUTE, iWordWhitelist: ['smore'] });
          filter.init();
          expect(filter.replaceText('Would you like sMorE smores?')).to.equal('Would you like sMorE slesss?');
          expect(filter.counter).to.equal(1);
        });
      });

      describe('Unicode characters', () => {
        it('Exact word with substitions marked and preserveCase with repeated characters', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.SUBSTITUTE, substitutionMark: true, preserveCase: true });
          filter.cfg.words['врата'] = { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, sub: 'door' };
          filter.init();
          expect(filter.replaceText('this even works on unicode WORDS like Врата, cool huh?')).to.equal('this even works on unicode [IDEA] like [Door], cool huh?');
        });
      });
    });

    describe('Remove', () => {
      describe('Exact', () => {
        it('Update stats', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.REMOVE });
          filter.init();
          expect(filter.counter).to.equal(0);
          expect(filter.replaceText('A cool, example sentence.')).to.equal('A cool, sentence.');
          expect(filter.counter).to.be.above(0);
        });

        it('Ending with punctuation', () => {
          const filter = new Filter;
          filter.cfg = new Config({ filterMethod: Constants.FILTER_METHODS.REMOVE, words: { 'this!': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: false } } });
          filter.init();
          expect(filter.replaceText('I love This! Do you?')).to.equal('I love Do you?');
          expect(filter.replaceText('I love this!')).to.equal('I love');
        });

        it('With separators', () => {
          const filter = new Filter;
          const words = { pizza: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: true } };
          filter.cfg = new Config({ words: words, filterMethod: Constants.FILTER_METHODS.REMOVE, censorCharacter: '*', censorFixedLength: 0, preserveFirst: true, preserveLast: true });
          filter.init();
          expect(filter.replaceText('I love to eat PPPPPP-I-----ZZZZZZZZZZZ__A!')).to.equal('I love to eat!');
        });
      });

      describe('Partial', () => {
        it('Not update stats', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.REMOVE });
          filter.init();
          expect(filter.counter).to.equal(0);
          expect(filter.replaceText('This Sample is a pretty good sampler to sample.', filter.wordlistId, false)).to.equal('This is a pretty good to.');
          expect(filter.counter).to.equal(0);
        });

        it('Ending with punctuation', () => {
          const filter = new Filter;
          filter.cfg = new Config({ filterMethod: Constants.FILTER_METHODS.REMOVE, words: { 'this!': { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: false } } });
          filter.init();
          expect(filter.replaceText('I love allthis! Do you?')).to.equal('I love Do you?');
          expect(filter.replaceText('I love this! Do you?')).to.equal('I love Do you?');
        });
      });

      it('Should filter a RegExp', () => {
        const filter = new Filter;
        filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.REMOVE });
        filter.cfg.words['this and everything after.*$'] = { matchMethod: Constants.MATCH_METHODS.REGEX, repeat: false, sub: 'substitute' };
        filter.init();
        expect(filter.replaceText('Have you ever done this and everything after it?')).to.equal('Have you ever done ');
      });

      describe('whitelist', () => {
        it('case-sensitive exact match', () => {
          const filter = new Filter;
          const words = { master: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, sub: 'padawan' } };
          filter.cfg = new Config({ words: Object.assign({}, words), filterMethod: Constants.FILTER_METHODS.REMOVE, wordWhitelist: ['Master'] });
          filter.init();
          expect(filter.replaceText('Can the master outsmart the Master?')).to.equal('Can the outsmart the Master?');
          expect(filter.counter).to.equal(1);
        });

        it('case-sensitive partial match', () => {
          const filter = new Filter;
          const words = { more: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true } };
          filter.cfg = new Config({ words: Object.assign({}, words), filterMethod: Constants.FILTER_METHODS.REMOVE, wordWhitelist: ['smores'] });
          filter.init();
          expect(filter.replaceText('Would you like smore smores?')).to.equal('Would you like smores?');
          expect(filter.counter).to.equal(1);
        });

        it('case-insensitive exact match)', () => {
          const filter = new Filter;
          const words = { pie: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, sub: 'cake' } };
          filter.cfg = new Config({ words: Object.assign({}, words), filterMethod: Constants.FILTER_METHODS.REMOVE, iWordWhitelist: ['pie'] });
          filter.init();
          expect(filter.replaceText('Apple pie is the best PIE!')).to.equal('Apple pie is the best PIE!');
          expect(filter.counter).to.equal(0);
        });
      });

      describe('Unicode characters', () => {
        it('Exact word', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.REMOVE });
          filter.cfg.words['врата'] = { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, sub: 'door' };
          filter.init();
          expect(filter.replaceText('This even works on врата. cool huh?')).to.equal('This even works on. cool huh?');
          expect(filter.replaceText('This even works on врата, cool huh?')).to.equal('This even works on, cool huh?');
          expect(filter.replaceText('This even works on врата?')).to.equal('This even works on?');
        });

        it('Partial word', () => {
          const filter = new Filter;
          filter.cfg = new Config({ words: Object.assign({}, testWords), filterMethod: Constants.FILTER_METHODS.REMOVE });
          filter.cfg.words['врата'] = { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, sub: 'door' };
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
      filter.cfg = new Config({ words: Object.assign({}, testWords) });
      filter.init();
      const string = 'this is my example';
      const result = filter.replaceTextResult(string);
      expect(result.filtered).to.equal('this is my demo');
      expect(result.original).to.equal(string);
      expect(result.modified).to.equal(true);
    });

    it('should generate a result object when not filtering', () => {
      const filter = new Filter;
      filter.cfg = new Config({ words: Object.assign({}, testWords) });
      filter.init();
      const string = 'this is my story';
      const result = filter.replaceTextResult(string);
      expect(result.filtered).to.equal(string);
      expect(result.original).to.equal(string);
      expect(result.modified).to.equal(false);
    });
  });
});