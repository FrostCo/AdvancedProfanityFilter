import { expect } from 'chai';
import Constants from '@APF/lib/Constants';
import Config from '@APF/lib/Config';
import Word from '@APF/lib/Word';

describe('Word', function () {
  describe('Regular Expressions', function () {
    describe('Exact Matching', function () {
      it('should build RegExp', function () {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.EXACT }, Config._defaults);
        expect(word.regExp).to.eql(/\bword\b/gi);
      });

      it('should build RegExp with matchRepeated', function () {
        const word = new Word(
          'word',
          { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE },
          Config._defaults,
        );
        expect(word.regExp).to.eql(/\bw+o+r+d+\b/gi);
      });

      it('should throw exception for invalid RegExp', function () {
        expect(() => {
          new Word(null, {}, {});
        }).to.throw();
      });

      it('should build RegExp with ending punctuation', function () {
        const word = new Word('word!', { matchMethod: Constants.MATCH_METHODS.EXACT }, Config._defaults);
        expect(word.unicode).to.eql(false);
        expect(word.regExp).to.eql(/(^|\s)(word!)(\s|$)/gi);
      });

      it('should build RegExp with ending dash (-)', function () {
        const word = new Word('word-', { matchMethod: Constants.MATCH_METHODS.EXACT }, Config._defaults);
        expect(word.unicode).to.eql(true);
        expect(word.regExp).to.eql(/(^|[\s.,'"+!?|-]+)(word-)([\s.,'"+!?|-]+|$)/giu);
      });

      it('should build RegExp with matchSeparators and matchRepeated', function () {
        const word = new Word(
          'word',
          { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, separators: Constants.TRUE },
          Config._defaults,
        );
        expect(word.regExp).to.eql(/\bw+[-_ ]*o+[-_ ]*r+[-_ ]*d+\b/gi);
      });

      // Work around for lack of word boundary support for unicode characters
      describe('Unicode', function () {
        it('should use workaround for UTF word boundaries', function () {
          const word = new Word('врата', { matchMethod: Constants.MATCH_METHODS.EXACT }, Config._defaults);
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(/(^|[\s.,'"+!?|-]+)(врата)([\s.,'"+!?|-]+|$)/giu);
        });

        it('should use workaround for UTF word boundaries with matchRepeated', function () {
          const word = new Word(
            'врата',
            { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE },
            Config._defaults,
          );
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(/(^|[\s.,'"+!?|-]+)(в+р+а+т+а+)([\s.,'"+!?|-]+|$)/giu);
        });
      });

      it('should throw error on invalid regexp', function () {
        // Using a function wrapper to test for constructor exceptions
        const constructorWrapper = () => {
          new Word('$\\z+(^', { matchMethod: Constants.MATCH_METHODS.REGEX }, Config._defaults);
        };
        expect(constructorWrapper).to.throw(Error);
      });
    });

    describe('Partial Match', function () {
      it('should build RegExp', function () {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.PARTIAL }, Config._defaults);
        expect(word.regExp).to.eql(/word/gi);
      });

      it('should build RegExp with matchRepeated', function () {
        const word = new Word(
          'word',
          { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE },
          Config._defaults,
        );
        expect(word.regExp).to.eql(/w+o+r+d+/gi);
      });

      it('should build RegExp with matchSeparators', function () {
        const word = new Word(
          'word',
          { matchMethod: Constants.MATCH_METHODS.PARTIAL, separators: Constants.TRUE },
          Config._defaults,
        );
        expect(word.regExp).to.eql(/w[-_ ]*o[-_ ]*r[-_ ]*d/gi);
      });

      it('should build RegExp with matchSeparators and matchRepeated', function () {
        const word = new Word(
          'word',
          { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, separators: Constants.TRUE },
          Config._defaults,
        );
        expect(word.regExp).to.eql(/w+[-_ ]*o+[-_ ]*r+[-_ ]*d+/gi);
      });
    });

    describe('Remove Exact', function () {
      it('should build RegExp', function () {
        const word = new Word(
          'word',
          { matchMethod: Constants.MATCH_METHODS.EXACT, _filterMethod: Constants.FILTER_METHODS.REMOVE },
          Config._defaults,
        );
        expect(word.regExp).to.eql(/\s?\bword\b\s?/gi);
      });

      it('should build RegExp with matchRepeated', function () {
        const word = new Word(
          'word',
          {
            matchMethod: Constants.MATCH_METHODS.EXACT,
            repeat: Constants.TRUE,
            _filterMethod: Constants.FILTER_METHODS.REMOVE,
          },
          Config._defaults,
        );
        expect(word.regExp).to.eql(/\s?\bw+o+r+d+\b\s?/gi);
      });

      it('should build RegExp with ending punctuation', function () {
        const word = new Word(
          'word!',
          { matchMethod: Constants.MATCH_METHODS.EXACT, _filterMethod: Constants.FILTER_METHODS.REMOVE },
          Config._defaults,
        );
        expect(word.regExp).to.eql(/(^|\s)(word!)(\s|$)/gi);
      });

      // Work around for lack of word boundary support for unicode characters
      describe('Unicode', function () {
        it('should build RegExp', function () {
          const word = new Word(
            'куче',
            { matchMethod: Constants.MATCH_METHODS.EXACT, _filterMethod: Constants.FILTER_METHODS.REMOVE },
            Config._defaults,
          );
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(/(^|[\s.,'"+!?|-])(куче)([\s.,'"+!?|-]|$)/giu);
        });

        it('should build RegExp with matchRepeated', function () {
          const word = new Word(
            'куче',
            {
              matchMethod: Constants.MATCH_METHODS.EXACT,
              repeat: Constants.TRUE,
              _filterMethod: Constants.FILTER_METHODS.REMOVE,
            },
            Config._defaults,
          );
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(/(^|[\s.,'"+!?|-])(к+у+ч+е+)([\s.,'"+!?|-]|$)/giu);
        });
      });
    });

    describe('Remove Partial Match', function () {
      it('should build RegExp', function () {
        const word = new Word(
          'word',
          { matchMethod: Constants.MATCH_METHODS.PARTIAL },
          Object.assign(Config._defaults, { filterMethod: Constants.FILTER_METHODS.REMOVE }),
        );
        expect(word.regExp).to.eql(/\s?\b[\w-]*word[\w-]*\b\s?/gi);
      });

      it('should build RegExp with matchRepeated', function () {
        const word = new Word(
          'word',
          { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE },
          Object.assign(Config._defaults, { filterMethod: Constants.FILTER_METHODS.REMOVE }),
        );
        expect(word.regExp).to.eql(/\s?\b[\w-]*w+o+r+d+[\w-]*\b\s?/gi);
      });

      it('should build RegExp with ending punctuation', function () {
        const word = new Word(
          'word!',
          { matchMethod: Constants.MATCH_METHODS.PARTIAL },
          Object.assign(Config._defaults, { filterMethod: Constants.FILTER_METHODS.REMOVE }),
        );
        expect(word.regExp).to.eql(/(^|\s)([\w-]*word![\w-]*)(\s|$)/gi);
      });

      it('should build RegExp with ending colon', function () {
        const word = new Word(
          'app. rate:',
          { matchMethod: Constants.MATCH_METHODS.PARTIAL },
          Object.assign(Config._defaults, { filterMethod: Constants.FILTER_METHODS.REMOVE }),
        );
        expect(word.regExp).to.eql(/(^|\s)([\w-]*app\. rate:[\w-]*)(\s|$)/gi);
      });

      // Work around for lack of word boundary support for unicode characters
      describe('Unicode', function () {
        it('should build RegExp', function () {
          const word = new Word(
            'куче',
            { matchMethod: Constants.MATCH_METHODS.PARTIAL },
            Object.assign(Config._defaults, { filterMethod: Constants.FILTER_METHODS.REMOVE }),
          );
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(/(^|[\s.,'"+!?|-]?)([\w-]*куче[\w-]*)([\s.,'"+!?|-]?|$)/giu);
        });

        it('should build RegExp with matchRepeated', function () {
          const word = new Word(
            'куче',
            { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE },
            Object.assign(Config._defaults, { filterMethod: Constants.FILTER_METHODS.REMOVE }),
          );
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(/(^|[\s.,'"+!?|-]?)([\w-]*к+у+ч+е+[\w-]*)([\s.,'"+!?|-]?|$)/giu);
        });
      });
    });

    describe('Whole Match', function () {
      it('should build RegExp', function () {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.WHOLE }, Config._defaults);
        expect(word.regExp).to.eql(/\b[\w-]*word[\w-]*\b/gi);
      });

      it('should build RegExp with matchRepeated', function () {
        const word = new Word(
          'word',
          { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: Constants.TRUE },
          Config._defaults,
        );
        expect(word.regExp).to.eql(/\b[\w-]*w+o+r+d+[\w-]*\b/gi);
      });

      it('should build RegExp with ending punctuation', function () {
        const word = new Word('word!', { matchMethod: Constants.MATCH_METHODS.WHOLE }, Config._defaults);
        expect(word.regExp).to.eql(/(^|\s)([\S]*word![\S]*)(\s|$)/gi);
      });

      // Work around for lack of word boundary support for unicode characters
      describe('Unicode', function () {
        it('should build RegExp', function () {
          const word = new Word('куче', { matchMethod: Constants.MATCH_METHODS.WHOLE }, Config._defaults);
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(/(^|[\s.,'"+!?|-]*)([\S]*куче[\S]*)([\s.,'"+!?|-]*|$)/giu);
        });

        it('should build RegExp with matchRepeated', function () {
          const word = new Word(
            'куче',
            { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: Constants.TRUE },
            Config._defaults,
          );
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(/(^|[\s.,'"+!?|-]*)([\S]*к+у+ч+е+[\S]*)([\s.,'"+!?|-]*|$)/giu);
        });

        it('should build RegExp with matchRepeated and matchSeparators', function () {
          const word = new Word(
            'куче',
            { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: Constants.TRUE, separators: Constants.TRUE },
            Config._defaults,
          );
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(/(^|[\s.,'"+!?|-]*)([\S]*к+[-_ ]*у+[-_ ]*ч+[-_ ]*е+[\S]*)([\s.,'"+!?|-]*|$)/giu);
        });
      });
    });
  });

  describe('Capitalization', () => {
    describe('allLowerCase()', function () {
      it('should return true when all lowercase', function () {
        expect(Word.allLowerCase('lower')).to.equal(true);
      });

      it('should return false when not all lowercase', function () {
        expect(Word.allLowerCase('Lower')).to.equal(false);
      });
    });

    describe('allUpperCase()', function () {
      it('should return true when all uppercase', function () {
        expect(Word.allUpperCase('UPPER')).to.equal(true);
      });

      it('should return false when not all uppercase', function () {
        expect(Word.allUpperCase('upper')).to.equal(false);
      });
    });

    describe('capitalizeEachWord()', function () {
      it('should return a string with the first character of each word capitalized', function () {
        expect(Word.capitalizeEachWord('live long and prosper')).to.equal('Live Long And Prosper');
        expect(Word.capitalizeEachWord('cool')).to.equal('Cool');
      });

      it('should handle a phrase with repeated words', function () {
        expect(Word.capitalizeEachWord('the best in the world')).to.equal('The Best In The World');
      });

      it('should return a capitalized string when its already capitalized', function () {
        expect(Word.capitalizeEachWord('Upper Limit')).to.equal('Upper Limit');
      });
    });

    describe('capitalizeFirst()', function () {
      it('should return a string with the first character capitalized', function () {
        expect(Word.capitalizeFirst('upper')).to.equal('Upper');
      });

      it('should return a capitalized string when its already capitalized', function () {
        expect(Word.capitalizeFirst('Upper')).to.equal('Upper');
      });
    });

    describe('eachWordCapitalized()', function () {
      it('should return true when only the first character of each word is capitalized', function () {
        expect(Word.eachWordCapitalized('Upper Limit')).to.equal(true);
        expect(Word.eachWordCapitalized('Upper')).to.equal(true);
      });

      it('should return false when each word does not start with a capital letter', function () {
        expect(Word.eachWordCapitalized('Upper limit')).to.equal(false);
      });
    });

    describe('firstCapitalized()', function () {
      it('should return true when only the first character of the word is capitalized', function () {
        expect(Word.firstCapitalized('Upper')).to.equal(true);
      });

      it('should return false when word does not start with a capital letter', function () {
        expect(Word.firstCapitalized('upper')).to.equal(false);
      });
    });
  });

  describe('constructor()', function () {
    it('should use all provided defaults', function () {
      const cfg = Object.assign({}, Config._defaults, { defaultWordMatchMethod: Constants.MATCH_METHODS.WHOLE });
      const options = {};
      const word = new Word('train', options, cfg);
      expect(word.matchMethod).to.eql(Constants.MATCH_METHODS.WHOLE);
      expect(word.matchRepeated).to.eql(cfg.defaultWordRepeat);
      expect(word.lists).to.eql([]);
      expect(word.matchSeparators).to.eql(cfg.defaultWordSeparators);
    });

    it('should use provided matchMethod (Exact) and fill in defaults', function () {
      const cfg = Object.assign({}, Config._defaults, { defaultWordMatchMethod: Constants.MATCH_METHODS.WHOLE });
      const options = { lists: [1, 5], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE };
      const word = new Word('again', options, cfg);
      expect(word.matchMethod).to.eql(options.matchMethod);
      expect(word.matchRepeated).to.eql(options.repeat);
      expect(word.lists).to.eq(options.lists);
      expect(word.matchSeparators).to.eql(cfg.defaultWordSeparators);
    });

    it('should use provided matchMethod (Whole) and fill in defaults', function () {
      const cfg = Config._defaults;
      const options = { matchMethod: Constants.MATCH_METHODS.WHOLE, separators: Constants.TRUE };
      const word = new Word('testing', options, cfg);
      expect(word.matchMethod).to.eql(options.matchMethod);
      expect(word.matchRepeated).to.eql(cfg.defaultWordRepeat);
      expect(word.lists).to.eql([]);
      expect(word.matchSeparators).to.eql(options.separators);
    });
  });

  describe('containsDoubleByte()', function () {
    it('should return true when string includes a double-byte UTF character', function () {
      expect(Word.containsDoubleByte('врата')).to.equal(true);
    });

    it('should return false when string does not include a double-byte UTF character', function () {
      expect(Word.containsDoubleByte('$p[cialC@se')).to.equal(false);
    });

    it('should return false on empty string', function () {
      expect(Word.containsDoubleByte('')).to.equal(false);
    });
  });

  describe('escapeRegExp()', function () {
    it('should escape a string with special characters escaped', function () {
      expect(Word.escapeRegExp('$pecial')).to.equal('\\$pecial');
    });

    it('should escape a string with multiple special characters escaped', function () {
      expect(Word.escapeRegExp('$p[cialC@se')).to.equal('\\$p\\[cialC@se');
    });

    it('should not alter non-special characters', function () {
      expect(Word.escapeRegExp('SpecialCase')).to.equal('SpecialCase');
    });
  });
});
