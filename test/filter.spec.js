const expect = require('chai').expect;
// import * as bundle from '../dist/filter.bundle';
import {Filter} from '../dist/filter'

// TODO: remove filter

const testWords = {
  'example': { matchMethod: 0, repeat: true, words: ['demo'] },
  'placeholder': { matchMethod: 0, repeat: false, words: ['variable'] },
  'sample': { matchMethod: 1, repeat: false, words: ['piece'] },
  'word': { matchMethod: 2, repeat: true, words: ['idea'] }
}

describe('Filter', function() {
  describe('disabledPage()', function() {
    let filter = new Filter;
    filter.cfg = { disabledDomains: ['example.com', 'sub.sample.com'] };
    global.window = { location: { hostname: 'example.com' } };

    it('should return true when on a disabled domain', function() {
      expect(filter.disabledPage()).to.equal(true);
    });

    it('should return false when not on a disabled domain', function() {
      global.window.location.hostname = 'sample.com';
      expect(filter.disabledPage()).to.equal(false);
    });

    it('should return true when on a subdomain of a disabled parent domain', function() {
      global.window.location.hostname = 'sub.example.com';
      expect(filter.disabledPage()).to.equal(true);
    });
  });

  describe('generateWordList()', function() {
    it('should generate a sorted word list RegExp list', function() {
      let filter = new Filter;
      filter.cfg = { words: Object.assign({}, testWords) };
      filter.generateWordList();
      expect(filter.cfg.wordList.length).to.equal(4);
      expect(filter.cfg.wordList).to.eql(['placeholder', 'example', 'sample', 'word']);
    });
  });

  describe('generateRegexpList()', function() {
    describe('Global matching', function() {
      it('should return RegExp list for global exact match', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 0, globalMatchMethod: 0 };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.wordRegExps.length).to.equal(4);
        expect(filter.wordRegExps).to.eql([/\bplaceholder\b/gi, /\be+x+a+m+p+l+e+\b/gi, /\bsample\b/gi, /\bw+o+r+d+\b/gi]);
      });

      it('should return RegExp list for global part match', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 0, globalMatchMethod: 1 };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.wordRegExps.length).to.equal(4);
        expect(filter.wordRegExps).to.eql([/placeholder/gi, /e+x+a+m+p+l+e+/gi, /sample/gi, /w+o+r+d+/gi]);
      });

      it('should return RegExp list for global part match (default)', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 0 };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.wordRegExps.length).to.equal(4);
        expect(filter.wordRegExps).to.eql([/placeholder/gi, /e+x+a+m+p+l+e+/gi, /sample/gi, /w+o+r+d+/gi]);
      });

      it('should return RegExp list for global whole match (substitution filter)', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 1, globalMatchMethod: 2 };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.wordRegExps.length).to.equal(4);
        expect(filter.wordRegExps).to.eql([
          /\b[\w-]*placeholder[\w-]*\b/gi,
          /\b[\w-]*e+x+a+m+p+l+e+[\w-]*\b/gi,
          /\b[\w-]*sample[\w-]*\b/gi,
          /\b[\w-]*w+o+r+d+[\w-]*\b/gi
        ]);
      });
    });

    describe('Per-word matching', function() {
      it('should return RegExp list for per-word matching', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 0, globalMatchMethod: 3 };
        filter.cfg.words['^regexp.*?$'] = { matchMethod: 4, repeat: false, words: ['substitute'] };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.wordRegExps.length).to.equal(5);
        expect(filter.wordRegExps).to.eql([/\bplaceholder\b/gi, /^regexp.*?$/gi, /\be+x+a+m+p+l+e+\b/gi, /sample/gi, /\b[\w-]*w+o+r+d+[\w-]*\b/gi]);
      });
    });
  });

  describe('replaceText()', function() {
    describe('Censor Filter', function() {
      it('Should filter an exact word and preserveFirst', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 0, globalMatchMethod: 3, censorCharacter: '*', censorFixedLength: 0, preserveFirst: true, preserveLast: false };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.replaceText('this is a placeholder placeholder.')).to.equal('this is a p********** p**********.');
      });

      it('Should filter an exact word with (-) characters and no preserveFirst or preserveLast', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 0, globalMatchMethod: 3, censorCharacter: '-', censorFixedLength: 0, preserveFirst: false, preserveLast: false };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.replaceText('A cool example sentence.')).to.equal('A cool ------- sentence.');
      });

      it('Should filter an partial word with preserveFirst and preserveLast', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 0, globalMatchMethod: 3, censorCharacter: '*', censorFixedLength: 0, preserveFirst: true, preserveLast: true };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.replaceText('this sample is a pretty good sampler to sample.')).to.equal('this s****e is a pretty good s****er to s****e.');
      });

      it('Should filter a whole word with (_) characters and fixed length (3)', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 0, globalMatchMethod: 3, censorCharacter: '_', censorFixedLength: 3, preserveFirst: false, preserveLast: false };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.replaceText('Words used to be okay, but now even a word is bad.')).to.equal('___ used to be okay, but now even a ___ is bad.');
      });

      it('Should filter an RegExp and fixed length (5) with preserveFirst', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 0, globalMatchMethod: 3, censorCharacter: '_', censorFixedLength: 5, preserveFirst: true, preserveLast: false };
        filter.cfg.words['^The'] = { matchMethod: 4, repeat: false, words: ['substitute'] };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.replaceText('The best things are always the best.')).to.equal('T____ best things are always the best.');
      });

      describe('Unicode characters', function() {
        it('Should filter an exact word and preserveFirst', function() {
          let filter = new Filter;
          filter.cfg = { words: Object.assign({}, testWords), filterMethod: 0, globalMatchMethod: 3, censorCharacter: '*', censorFixedLength: 0, preserveFirst: true, preserveLast: false };
          filter.cfg.words['врата'] = { matchMethod: 0, repeat: true, words: ['door'] };
          filter.generateWordList();
          filter.generateRegexpList();
          expect(filter.replaceText('this even works on unicode words like врата, cool huh?')).to.equal('this even works on unicode w**** like в****, cool huh?');
        });

        it('Should filter an partial word with preserveFirst and preserveLast', function() {
          let filter = new Filter;
          filter.cfg = { words: Object.assign({}, testWords), filterMethod: 0, globalMatchMethod: 3, censorCharacter: '*', censorFixedLength: 0, preserveFirst: true, preserveLast: true };
          filter.cfg.words['котка'] = { matchMethod: 1, repeat: true, words: ['cat'] };
          filter.generateWordList();
          filter.generateRegexpList();
          expect(filter.replaceText('The коткаs in the hat')).to.equal('The к***аs in the hat');
        });

        it('Should filter a whole word with (_) characters and preserveFirst', function() {
          let filter = new Filter;
          filter.cfg = { words: Object.assign({}, testWords), filterMethod: 0, globalMatchMethod: 3, censorCharacter: '_', censorFixedLength: 0, preserveFirst: true, preserveLast: false };
          filter.cfg.words['куче'] = { matchMethod: 2, repeat: true, words: ['dog'] };
          filter.generateWordList();
          filter.generateRegexpList();
          expect(filter.replaceText('The bigкучеs ran around the yard.')).to.equal('The b_______ ran around the yard.');
        });
      });
    });

    describe('Substitute Filter', function() {
      it('Should filter an exact word with substitions marked and preserveCase', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 1, globalMatchMethod: 3, substitutionMark: true, preserveCase: true };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.replaceText('I love having good examples as an Example.')).to.equal('I love having good examples as an [Demo].');
      });

      it('Should filter an exact word with substitions marked and preserveCase with repeated characters', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 1, globalMatchMethod: 3, substitutionMark: true, preserveCase: true };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.replaceText('I love having good examples as an Exxaammppllee.')).to.equal('I love having good examples as an [Demo].');
      });

      it('Should filter an partial word with substitions not marked and preserveCase', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 1, globalMatchMethod: 3, substitutionMark: false, preserveCase: true };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.replaceText('This Sample is a pretty good sampler to sample.')).to.equal('This Piece is a pretty good piecer to piece.');
      });

      it('Should filter an partial word with substitions not marked, not repeated, and preserveCase', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 1, globalMatchMethod: 3, substitutionMark: false, preserveCase: true };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.replaceText('This Sample is a pretty good sampler to saammppllee.')).to.equal('This Piece is a pretty good piecer to saammppllee.');
      });

      it('Should filter an partial word with substitions marked and preserveCase', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 1, globalMatchMethod: 3, substitutionMark: true, preserveCase: true };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.replaceText('This Sample is a pretty good sampler to sample.')).to.equal('This [Piece] is a pretty good [piece]r to [piece].');
      });
    });

    describe('Remove Filter', function() {
      it('Should filter an exact word', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 2, globalMatchMethod: 3 };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.replaceText('A cool example sentence.')).to.equal('A cool sentence.');
      });

      it('Should filter an partial word', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 2, globalMatchMethod: 3 };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.replaceText('This Sample is a pretty good sampler to sample.')).to.equal('This is a pretty good to.');
      });

      it('Should filter a RegExp', function() {
        let filter = new Filter;
        filter.cfg = { words: Object.assign({}, testWords), filterMethod: 2, globalMatchMethod: 3 };
        filter.cfg.words['this and everything after.*$'] = { matchMethod: 4, repeat: false, words: ['substitute'] };
        filter.generateWordList();
        filter.generateRegexpList();
        expect(filter.replaceText('Have you ever done this and everything after it?')).to.equal('Have you ever done ');
      });
    });
  });
});