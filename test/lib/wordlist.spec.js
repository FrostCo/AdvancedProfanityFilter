const expect = require('chai').expect;
import Constants from '../built/lib/constants';
import Wordlist from '../built/lib/wordlist';

const testWords = {
  'example': { lists: [1], matchMethod: Constants.MatchMethods.Exact, repeat: true, sub: 'demo' },
  'placeholder': { lists: [1,2], matchMethod: Constants.MatchMethods.Exact, repeat: false, sub: 'variable' },
  'sample': { lists: [2], matchMethod: Constants.MatchMethods.Partial, repeat: false, sub: 'piece' },
  'word': { matchMethod: Constants.MatchMethods.Whole, repeat: true, sub: 'idea' }
};

describe('Wordlist', function() {
  describe('constructor', function() {
    it('should build a new wordlist with all words', function() {
      let wordlist = new Wordlist({ words: testWords }, 0);
      expect(wordlist.all.length).to.equal(4);
      expect(wordlist.list).to.eql(['placeholder', 'example', 'sample', 'word']);
      expect(wordlist.regExps.length).to.equal(4);
    });

    it('should build a new wordlist assigned to wordlist 1', function() {
      let wordlist = new Wordlist({ words: testWords }, 1);
      expect(wordlist.all.length).to.equal(3);
      expect(wordlist.list).to.eql(['placeholder', 'example', 'word']);
      expect(wordlist.regExps.length).to.equal(3);
    });
  });

  describe('find()', function() {
    it('by name (string)', function() {
      let wordlist = new Wordlist({ words: testWords }, 0);
      expect(wordlist.find('word').sub).to.equal('idea');
    });

    it('by id', function() {
      let wordlist = new Wordlist({ words: testWords }, 2);
      expect(wordlist.find(1).value).to.equal('sample');
    });

    it('non-existent word', function() {
      let wordlist = new Wordlist({ words: testWords }, 2);
      expect(wordlist.find(99)).to.equal(undefined);
      expect(wordlist.find('non-existent')).to.equal(undefined);
    });
  });
});