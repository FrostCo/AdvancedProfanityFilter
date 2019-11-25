const expect = require('chai').expect;
import Word from '../built/lib/word';

describe('Word', function() {
  describe('Regular Expressions', function() {
    describe('Exact Matching', function() {
      it('should build RegExp', function() {
        Word.initWords({'word': {matchMethod: 0}}, {filterMethod: 0}); // TODO: Shouldn't need filtermethod
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/\bword\b/gi);
      });

      it('should build RegExp with matchRepeated', function() {
        Word.initWords({'word': {matchMethod: 0, repeat: true}}, {filterMethod: 0}); // TODO: Shouldn't need filtermethod
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/\bw+o+r+d+\b/gi);
      });

      it('should build RegExp without capitalized', function() {
        Word.initWords({'word': {matchMethod: 0, capitalized: false}});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/\bw[Oo][Rr][Dd]\b/g);
      });

      it('should build RegExp without capitalized and be escaped', function() {
        Word.initWords({'ke$ha': {matchMethod: 0, capitalized: false}});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/\bk[Ee]\$[Hh][Aa]\b/g);
      });

      it('should build RegExp and ignore capitalized when not possible', function() {
        Word.initWords({'5chool': {matchMethod: 0, capitalized: false}});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/\b5chool\b/gi);
      });

      it('should build RegExp without capitalized with matchRepeated', function() {
        Word.initWords({'word': {matchMethod: 0, capitalized: false, repeat: true}});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/\bw+[Oo]+[Rr]+[Dd]+\b/g);
      });

      it('should throw exception for invalid RegExp', function() {
        expect(() => {
          let word = new Word(null, {});
          word.buildRegexp();
        }).to.throw();
      });

      it('should build RegExp with ending punctuation', function() {
        Word.initWords({'word!': {matchMethod: 0}});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0].unicode).to.eql(false);
        expect(wordRegExps[0]).to.eql(/(^|\s)(word!)(\s|$)/gi);
      });

      it('should build RegExp with ending punctuation and ignore capitalized', function() {
        Word.initWords({'$chool': {matchMethod: 0, capitalized: false}});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/(^|\s)(\$chool)(\s|$)/gi);
      });

      // Work around for lack of word boundary support for unicode characters
      describe('Unicode', function() {
        it('should use workaround for UTF word boundaries', function() {
          Word.initWords({'врата': {matchMethod: 0}});
          let wordRegExps = Word.regExps;
          expect(wordRegExps[0].unicode).to.eql(true);
          expect(wordRegExps[0]).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-]+)(врата)([\\s.,\'"+!?|-]+|$)', 'giu')
          );
        });

        it('should use workaround for UTF word boundaries with matchRepeated', function() {
          Word.initWords({'врата': {matchMethod: 0, repeat: true}});
          let wordRegExps = Word.regExps;
          expect(wordRegExps[0].unicode).to.eql(true);
          expect(wordRegExps[0]).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-]+)(в+р+а+т+а+)([\\s.,\'"+!?|-]+|$)', 'giu')
          );
        });
      });
    });

    describe('Partial Match', function() {
      it('should build RegExp', function() {
        Word.initWords({word: {matchMethod: 1}});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/word/gi);
      });

      it('should build RegExp with matchRepeated', function() {
        Word.initWords({word: {matchMethod: 1, repeat: true}});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/w+o+r+d+/gi);
      });

      it('should build RegExp without capitalized', function() {
        Word.initWords({'word': {matchMethod: 1, capitalized: false}});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/w[Oo][Rr][Dd]/g);
      });

      it('should build RegExp without capitalized with matchRepeated', function() {
        Word.initWords({'word': {matchMethod: 1, capitalized: false, repeat: true}});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/w+[Oo]+[Rr]+[Dd]+/g);
      });
    });

    describe('Remove Exact', function() {
      it('should build RegExp', function() {
        Word.initWords({word: {matchMethod: 0}}, {filterMethod: 2});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/\s?\bword\b\s?/gi);
      });

      it('should build RegExp with matchRepeated', function() {
        Word.initWords({word: {matchMethod: 0, repeat: true}}, {filterMethod: 2});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/\s?\bw+o+r+d+\b\s?/gi);
      });

      it('should build RegExp with ending punctuation', function() {
        Word.initWords({'word!': {matchMethod: 0}}, {filterMethod: 2});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/(^|\s)(word!)(\s|$)/gi);
      });

      // Work around for lack of word boundary support for unicode characters
      describe('Unicode', function() {
        it('should build RegExp', function() {
          Word.initWords({'куче': {matchMethod: 0}}, {filterMethod: 2});
          let wordRegExps = Word.regExps;
          expect(wordRegExps[0].unicode).to.eql(true);
          expect(wordRegExps[0]).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-])(куче)([\\s.,\'"+!?|-]|$)', 'giu')
          );
        });

        it('should build RegExp with matchRepeated', function() {
          Word.initWords({'куче': {matchMethod: 0, repeat: true}}, {filterMethod: 2});
          let wordRegExps = Word.regExps;
          expect(wordRegExps[0].unicode).to.eql(true);
          expect(wordRegExps[0]).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-])(к+у+ч+е+)([\\s.,\'"+!?|-]|$)', 'giu')
          );
        });
      });
    });

    describe('Remove Partial Match', function() {
      it('should build RegExp', function() {
        Word.initWords({'word': {matchMethod: 1}}, {filterMethod: 2});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/\s?\b[\w-]*word[\w-]*\b\s?/gi);
      });

      it('should build RegExp with matchRepeated', function() {
        Word.initWords({'word': {matchMethod: 1, repeat: true}}, {filterMethod: 2});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/\s?\b[\w-]*w+o+r+d+[\w-]*\b\s?/gi);
      });

      it('should build RegExp with ending punctuation', function() {
        Word.initWords({'word!': {matchMethod: 1}}, {filterMethod: 2});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/(^|\s)([\w-]*word![\w-]*)(\s|$)/gi);
      });

      // Work around for lack of word boundary support for unicode characters
      describe('Unicode', function() {
        it('should build RegExp', function() {
          Word.initWords({'куче': {matchMethod: 1}}, {filterMethod: 2});
          let wordRegExps = Word.regExps;
          expect(wordRegExps[0].unicode).to.eql(true);
          expect(wordRegExps[0]).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-]?)([\\w-]*куче[\\w-]*)([\\s.,\'"+!?|-]?|$)', 'giu')
          );
        });

        it('should build RegExp with matchRepeated', function() {
          Word.initWords({'куче': {matchMethod: 1, repeat: true}}, {filterMethod: 2});
          let wordRegExps = Word.regExps;
          expect(wordRegExps[0].unicode).to.eql(true);
          expect(wordRegExps[0]).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-]?)([\\w-]*к+у+ч+е+[\\w-]*)([\\s.,\'"+!?|-]?|$)', 'giu')
          );
        });
      });
    });

    describe('Whole Match', function() {
      it('should build RegExp', function() {
        Word.initWords({'word': {matchMethod: 2}});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/\b[\w-]*word[\w-]*\b/gi);
      });

      it('should build RegExp with matchRepeated', function() {
        Word.initWords({'word': {matchMethod: 2, repeat: true}});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/\b[\w-]*w+o+r+d+[\w-]*\b/gi);
      });

      it('should build RegExp with ending punctuation', function() {
        Word.initWords({'word!': {matchMethod: 2}});
        let wordRegExps = Word.regExps;
        expect(wordRegExps[0]).to.eql(/(^|\s)([\S]*word![\S]*)(\s|$)/gi);
      });

      // Work around for lack of word boundary support for unicode characters
      describe('Unicode', function() {
        it('should build RegExp', function() {
          Word.initWords({'куче': {matchMethod: 2}});
          let wordRegExps = Word.regExps;
          expect(wordRegExps[0].unicode).to.eql(true);
          expect(wordRegExps[0]).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-]*)([\\S]*куче[\\S]*)([\\s.,\'"+!?|-]*|$)', 'giu')
          );
        });

        it('should build RegExp with matchRepeated', function() {
          Word.initWords({'куче': {matchMethod: 2, repeat: true}});
          let wordRegExps = Word.regExps;
          expect(wordRegExps[0].unicode).to.eql(true);
          expect(wordRegExps[0]).to.eql(
            new RegExp('(^|[\\s.,\'"+!?|-]*)([\\S]*к+у+ч+е+[\\S]*)([\\s.,\'"+!?|-]*|$)', 'giu')
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