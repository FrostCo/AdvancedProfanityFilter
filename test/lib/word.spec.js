import { expect } from 'chai';
import Constants from '../built/lib/constants';
import Config from '../built/lib/config';
import Word from '../built/lib/word';

describe('Word', function() {
  describe('Regular Expressions', function() {
    describe('Exact Matching', function() {
      it('should build RegExp', function() {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.EXACT }, Config._defaults);
        expect(word.regExp).to.eql(/\bword\b/gi);
      });

      it('should build RegExp with matchRepeated', function() {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true }, Config._defaults);
        expect(word.regExp).to.eql(/\bw+o+r+d+\b/gi);
      });

      it('should throw exception for invalid RegExp', function() {
        expect(() => {
          new Word(null, {}, {});
        }).to.throw();
      });

      it('should build RegExp with ending punctuation', function() {
        const word = new Word('word!', { matchMethod: Constants.MATCH_METHODS.EXACT }, Config._defaults);
        expect(word.unicode).to.eql(false);
        expect(word.regExp).to.eql(/(^|\s)(word!)(\s|$)/gi);
      });

      it('should build RegExp with matchSeparators and matchRepeated', function() {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: true }, Config._defaults);
        expect(word.regExp).to.eql(/\bw+[-_ ]*o+[-_ ]*r+[-_ ]*d+\b/gi);
      });

      // Work around for lack of word boundary support for unicode characters
      describe('Unicode', function() {
        it('should use workaround for UTF word boundaries', function() {
          const word = new Word('врата', { matchMethod: Constants.MATCH_METHODS.EXACT }, Config._defaults);
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-]+)(врата)([\\s.,\'"+!?|-]+|$)', 'giu')
          );
        });

        it('should use workaround for UTF word boundaries with matchRepeated', function() {
          const word = new Word('врата', { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true }, Config._defaults);
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-]+)(в+р+а+т+а+)([\\s.,\'"+!?|-]+|$)', 'giu')
          );
        });
      });
    });

    describe('Partial Match', function() {
      it('should build RegExp', function() {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.PARTIAL }, Config._defaults);
        expect(word.regExp).to.eql(/word/gi);
      });

      it('should build RegExp with matchRepeated', function() {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true }, Config._defaults);
        expect(word.regExp).to.eql(/w+o+r+d+/gi);
      });

      it('should build RegExp with matchSeparators', function() {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.PARTIAL, separators: true }, Config._defaults);
        expect(word.regExp).to.eql(/w[-_ ]*o[-_ ]*r[-_ ]*d/gi);
      });

      it('should build RegExp with matchSeparators and matchRepeated', function() {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: true }, Config._defaults);
        expect(word.regExp).to.eql(/w+[-_ ]*o+[-_ ]*r+[-_ ]*d+/gi);
      });
    });

    describe('Remove Exact', function() {
      it('should build RegExp', function() {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.EXACT, _filterMethod: Constants.FILTER_METHODS.REMOVE }, Config._defaults);
        expect(word.regExp).to.eql(/\s?\bword\b\s?/gi);
      });

      it('should build RegExp with matchRepeated', function() {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, _filterMethod: Constants.FILTER_METHODS.REMOVE }, Config._defaults);
        expect(word.regExp).to.eql(/\s?\bw+o+r+d+\b\s?/gi);
      });

      it('should build RegExp with ending punctuation', function() {
        const word = new Word('word!', { matchMethod: Constants.MATCH_METHODS.EXACT, _filterMethod: Constants.FILTER_METHODS.REMOVE }, Config._defaults);
        expect(word.regExp).to.eql(/(^|\s)(word!)(\s|$)/gi);
      });

      // Work around for lack of word boundary support for unicode characters
      describe('Unicode', function() {
        it('should build RegExp', function() {
          const word = new Word('куче', { matchMethod: Constants.MATCH_METHODS.EXACT, _filterMethod: Constants.FILTER_METHODS.REMOVE }, Config._defaults);
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-])(куче)([\\s.,\'"+!?|-]|$)', 'giu')
          );
        });

        it('should build RegExp with matchRepeated', function() {
          const word = new Word('куче', { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, _filterMethod: Constants.FILTER_METHODS.REMOVE }, Config._defaults);
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-])(к+у+ч+е+)([\\s.,\'"+!?|-]|$)', 'giu')
          );
        });
      });
    });

    describe('Remove Partial Match', function() {
      it('should build RegExp', function() {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.PARTIAL }, Object.assign(Config._defaults, { filterMethod: Constants.FILTER_METHODS.REMOVE }));
        expect(word.regExp).to.eql(/\s?\b[\w-]*word[\w-]*\b\s?/gi);
      });

      it('should build RegExp with matchRepeated', function() {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true }, Object.assign(Config._defaults, { filterMethod: Constants.FILTER_METHODS.REMOVE }));
        expect(word.regExp).to.eql(/\s?\b[\w-]*w+o+r+d+[\w-]*\b\s?/gi);
      });

      it('should build RegExp with ending punctuation', function() {
        const word = new Word('word!', { matchMethod: Constants.MATCH_METHODS.PARTIAL }, Object.assign(Config._defaults, { filterMethod: Constants.FILTER_METHODS.REMOVE }));
        expect(word.regExp).to.eql(/(^|\s)([\w-]*word![\w-]*)(\s|$)/gi);
      });

      // Work around for lack of word boundary support for unicode characters
      describe('Unicode', function() {
        it('should build RegExp', function() {
          const word = new Word('куче', { matchMethod: Constants.MATCH_METHODS.PARTIAL }, Object.assign(Config._defaults, { filterMethod: Constants.FILTER_METHODS.REMOVE }));
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-]?)([\\w-]*куче[\\w-]*)([\\s.,\'"+!?|-]?|$)', 'giu')
          );
        });

        it('should build RegExp with matchRepeated', function() {
          const word = new Word('куче', { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true }, Object.assign(Config._defaults, { filterMethod: Constants.FILTER_METHODS.REMOVE }));
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-]?)([\\w-]*к+у+ч+е+[\\w-]*)([\\s.,\'"+!?|-]?|$)', 'giu')
          );
        });
      });
    });

    describe('Whole Match', function() {
      it('should build RegExp', function() {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.WHOLE }, Config._defaults);
        expect(word.regExp).to.eql(/\b[\w-]*word[\w-]*\b/gi);
      });

      it('should build RegExp with matchRepeated', function() {
        const word = new Word('word', { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: true }, Config._defaults);
        expect(word.regExp).to.eql(/\b[\w-]*w+o+r+d+[\w-]*\b/gi);
      });

      it('should build RegExp with ending punctuation', function() {
        const word = new Word('word!', { matchMethod: Constants.MATCH_METHODS.WHOLE }, Config._defaults);
        expect(word.regExp).to.eql(/(^|\s)([\S]*word![\S]*)(\s|$)/gi);
      });

      // Work around for lack of word boundary support for unicode characters
      describe('Unicode', function() {
        it('should build RegExp', function() {
          const word = new Word('куче', { matchMethod: Constants.MATCH_METHODS.WHOLE }, Config._defaults);
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-]*)([\\S]*куче[\\S]*)([\\s.,\'"+!?|-]*|$)', 'giu')
          );
        });

        it('should build RegExp with matchRepeated', function() {
          const word = new Word('куче', { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: true }, Config._defaults);
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-]*)([\\S]*к+у+ч+е+[\\S]*)([\\s.,\'"+!?|-]*|$)', 'giu')
          );
        });

        it('should build RegExp with matchRepeated and matchSeparators', function() {
          const word = new Word('куче', { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: true, separators: true }, Config._defaults);
          expect(word.unicode).to.eql(true);
          expect(word.regExp).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-]*)([\\S]*к+[-_ ]*у+[-_ ]*ч+[-_ ]*е+[\\S]*)([\\s.,\'"+!?|-]*|$)', 'giu')
          );
        });
      });
    });
  });

  describe('allLowerCase()', function() {
    it('should return true when all lowercase', function() {
      expect(Word.allLowerCase('lower')).to.equal(true);
    });

    it('should return false when not all lowercase', function() {
      expect(Word.allLowerCase('Lower')).to.equal(false);
    });
  });

  describe('allUpperCase()', function() {
    it('should return true when all uppercase', function() {
      expect(Word.allUpperCase('UPPER')).to.equal(true);
    });

    it('should return false when not all uppercase', function() {
      expect(Word.allUpperCase('upper')).to.equal(false);
    });
  });

  describe('capitalized()', function() {
    it('should return true when word is capitalized', function() {
      expect(Word.capitalized('Upper')).to.equal(true);
    });

    it('should return false when word is not capitalized', function() {
      expect(Word.capitalized('upper')).to.equal(false);
    });
  });

  describe('capitalize()', function() {
    it('should return a capitalized string', function() {
      expect(Word.capitalize('upper')).to.equal('Upper');
    });

    it('should return a capitalized string when its already capitalized', function() {
      expect(Word.capitalize('Upper')).to.equal('Upper');
    });
  });

  describe('constructor()', function() {
    it('should use all provided defaults', function() {
      const cfg = Object.assign({}, Config._defaults, { defaultWordMatchMethod: Constants.MATCH_METHODS.WHOLE });
      const options = {};
      const word = new Word('train', options, cfg);
      expect(word.matchMethod).to.eql(Constants.MATCH_METHODS.WHOLE);
      expect(word.matchRepeated).to.eql(cfg.defaultWordRepeat);
      expect(word.lists).to.eql([]);
      expect(word.matchSeparators).to.eql(cfg.defaultWordSeparators);
    });

    it('should use provided matchMethod (Exact) and fill in defaults', function() {
      const cfg = Object.assign({}, Config._defaults, { defaultWordMatchMethod: Constants.MATCH_METHODS.WHOLE });
      const options = { lists: [1, 5], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true };
      const word = new Word('again', options, cfg);
      expect(word.matchMethod).to.eql(options.matchMethod);
      expect(word.matchRepeated).to.eql(options.repeat);
      expect(word.lists).to.eq(options.lists);
      expect(word.matchSeparators).to.eql(cfg.defaultWordSeparators);
    });

    it('should use provided matchMethod (Whole) and fill in defaults', function() {
      const cfg = Config._defaults;
      const options = { matchMethod: Constants.MATCH_METHODS.WHOLE, separators: true };
      const word = new Word('testing', options, cfg);
      expect(word.matchMethod).to.eql(options.matchMethod);
      expect(word.matchRepeated).to.eql(cfg.defaultWordRepeat);
      expect(word.lists).to.eql([]);
      expect(word.matchSeparators).to.eql(options.separators);
    });
  });

  describe('containsDoubleByte()', function() {
    it('should return true when string includes a double-byte UTF character', function() {
      expect(Word.containsDoubleByte('врата')).to.equal(true);
    });

    it('should return false when string does not include a double-byte UTF character', function() {
      expect(Word.containsDoubleByte('$p[cialC@se')).to.equal(false);
    });
  });

  describe('escapeRegExp()', function() {
    it('should escape a string with special characters escaped', function() {
      expect(Word.escapeRegExp('$pecial')).to.equal('\\$pecial');
    });

    it('should escape a string with multiple special characters escaped', function() {
      expect(Word.escapeRegExp('$p[cialC@se')).to.equal('\\$p\\[cialC@se');
    });

    it('should not alter non-special characters', function() {
      expect(Word.escapeRegExp('SpecialCase')).to.equal('SpecialCase');
    });
  });
});