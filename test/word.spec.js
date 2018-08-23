const expect = require('chai').expect;
import Word from '../dist/word';

describe('Word', function() {
  describe('Regular Expressions', function() {
    describe('buildExactRegexp()', function() {
      it('should build the proper RegExp', function() {
        expect(Word.buildExactRegexp('word')).to.eql(/\bword\b/gi);
      });

      it('should build the proper RegExp with matchRepeated', function() {
        expect(Word.buildExactRegexp('word', true)).to.eql(/\bw+o+r+d+\b/gi);
      });
    });

    describe('buildPartRegexp()', function() {
      it('should build the proper RegExp for partial match', function() {
        expect(Word.buildPartRegexp('word')).to.eql(/word/gi);
      });

      it('should build the proper RegExp for partial match with matchRepeated', function() {
        expect(Word.buildPartRegexp('word', true)).to.eql(/w+o+r+d+/gi);
      });
    });

    describe('buildRegexpForRemoveExact()', function() {
      it('should build the proper RegExp for remove exact', function() {
        expect(Word.buildRegexpForRemoveExact('word')).to.eql(/\s?\bword\b\s?/gi);
      });

      it('should build the proper RegExp for remove exact with matchRepeated', function() {
        expect(Word.buildRegexpForRemoveExact('word', true)).to.eql(/\s?\bw+o+r+d+\b\s?/gi);
      });
    });

    // TODO: Test if repeat makes sense?
    describe('buildRegexpForRemovePart()', function() {
      it('should build the proper RegExp for remove part', function() {
        expect(Word.buildRegexpForRemovePart('word')).to.eql(/\s?\b[\w-]*word[\w-]*\b\s?/gi);
      });

      it('should build the proper RegExp for remove part with matchRepeated', function() {
        expect(Word.buildRegexpForRemovePart('word', true)).to.eql(/\s?\b[\w-]*w+o+r+d+[\w-]*\b\s?/gi);
      });
    });

    describe('buildWholeRegexp()', function() {
      it('should build the proper RegExp for whole match', function() {
        console.log(Word.buildRegexpForRemovePart('word'));
        console.log(Word.buildWholeRegexp('word'));
        expect(Word.buildWholeRegexp('word')).to.eql(/\b[\w-]*word[\w-]*\b/gi);
      });

      it('should build the proper RegExp for whole match with matchRepeated', function() {
        expect(Word.buildWholeRegexp('word', true)).to.eql(/\b[\w-]*w+o+r+d+[\w-]*\b/gi);
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

  describe('containsDoubleByte()', function() {
    it('should return true when string includes a double-byte UTF character', function() {
      expect(Word.containsDoubleByte('врата')).to.equal(true);
    });

    it('should return false when string does not include a double-byte UTF character', function() {
      expect(Word.containsDoubleByte('$p[cialC@se')).to.equal(false);
    });
  });
});