import { expect } from 'chai';
import sinon from 'sinon';
import Constants from '@APF/lib/constants';
import Wordlist from '@APF/lib/wordlist';

const testWords = {
  'example': { lists: [1], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.TRUE, sub: 'demo' },
  'placeholder': { lists: [1, 2], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: Constants.FALSE, sub: 'variable' },
  'sample': { lists: [2], matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.FALSE, sub: 'piece' },
  'word': { matchMethod: Constants.MATCH_METHODS.WHOLE, repeat: Constants.TRUE, sub: 'idea' }
};

describe('Wordlist', function() {
  describe('constructor', function() {
    it('should build a new wordlist with all words', function() {
      const wordlist = new Wordlist({ words: testWords }, 0);
      expect(wordlist.all.length).to.equal(4);
      expect(wordlist.list).to.eql(['placeholder', 'example', 'sample', 'word']);
      expect(wordlist.regExps.length).to.equal(4);
    });

    it('should build a new wordlist assigned to wordlist 1', function() {
      const wordlist = new Wordlist({ words: testWords }, 1);
      expect(wordlist.all.length).to.equal(3);
      expect(wordlist.list).to.eql(['placeholder', 'example', 'word']);
      expect(wordlist.regExps.length).to.equal(3);
    });

    it('should report warning on error adding word', function() {
      const logSpy = sinon.spy(Wordlist.logger, 'warn');
      const word = '$\\z+(^';
      const words = { [word]: { lists: [1], matchMethod: Constants.MATCH_METHODS.REGEX } };
      const wordlist = new Wordlist({ words: words }, 1);
      expect(wordlist.regExps.length).to.equal(0);
      expect(logSpy.callCount).to.equal(1);
      expect(logSpy.firstCall.args[0]).to.equal(`Failed to add '${word}' to wordlist.`);
    });
  });

  describe('find()', function() {
    it('by name (string)', function() {
      const wordlist = new Wordlist({ words: testWords }, 0);
      expect(wordlist.find('word').sub).to.equal('idea');
    });

    it('by id', function() {
      const wordlist = new Wordlist({ words: testWords }, 2);
      expect(wordlist.find(1).value).to.equal('sample');
    });

    it('return undefined with null', function() {
      const wordlist = new Wordlist({ words: testWords }, 2);
      expect(wordlist.find(null)).to.equal(undefined);
    });

    it('non-existent word', function() {
      const wordlist = new Wordlist({ words: testWords }, 2);
      expect(wordlist.find(99)).to.equal(undefined);
      expect(wordlist.find('non-existent')).to.equal(undefined);
    });
  });
});
