import { expect } from 'chai';
import Constants from '@APF/lib/Constants';
import Config from '@APF/lib/Config';

describe('Config', function () {
  describe('constructor()', function () {
    it('should create a new Config instance with defaults', function () {
      const config = new Config();
      expect(config instanceof Config).to.equal(true);
      expect(config.censorCharacter).to.equal('*');
      expect(config.censorFixedLength).to.equal(0);
    });

    it('should create a new Config instance with the provided data', function () {
      const config = new Config({ censorCharacter: '-' });
      expect(config instanceof Config).to.equal(true);
      expect(config.censorCharacter).to.equal('-');
      expect(config.censorFixedLength).to.equal(0);
    });
  });

  describe('_persistableKeys()', function () {
    it('should return list of persistable keys', function () {
      const config = new Config();
      expect(config._persistableKeys).to.equal(Config._persistableKeys);
    });
  });

  describe('addWord()', function () {
    const config = new Config(Config._defaults);
    config.words = Object.assign({}, Config._defaultWords);

    it('should add a new word to the config', function () {
      expect(config.addWord('newword')).to.equal(true);
      expect(Object.keys(config.words)).to.include('newword');
      expect(config.words['newword'].matchMethod).to.equal(config.defaultWordMatchMethod);
      expect(config.words['newword'].repeat).to.equal(config.defaultWordRepeat);
      expect(config.words['newword'].sub).to.equal('');
    });

    it('should add a new word to the config with provided options', function () {
      const wordOptions = { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: Constants.TRUE, sub: 'Older-word' };
      expect(config.addWord('newer-word', wordOptions)).to.equal(true);
      expect(Object.keys(config.words)).to.include('newer-word');
      expect(config.words['newer-word'].matchMethod).to.equal(wordOptions.matchMethod);
      expect(config.words['newer-word'].repeat).to.equal(wordOptions.repeat);
      expect(config.words['newer-word'].sub).to.equal(wordOptions.sub.toLowerCase());
    });

    it('should add a new word and not lower substitution when case-sensitive', function () {
      const word = 'mountain';
      const sub = 'MoLeHiLl';
      const options = { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, case: Constants.TRUE, sub: sub };
      expect(config.addWord(word, options)).to.equal(true);
      expect(config.words[word].sub).to.equal(sub);
    });

    it('should sanitize a new word before adding', function () {
      expect(config.addWord('anotherNewWord')).to.equal(true);
      expect(Object.keys(config.words)).to.include('anothernewword');
      expect(config.words['anothernewword'].matchMethod).to.equal(config.defaultWordMatchMethod);
      expect(config.words['anothernewword'].repeat).to.equal(config.defaultWordRepeat);
      expect(config.words['anothernewword'].sub).to.equal('');
    });

    it('should not lower a regex', function () {
      const options = { matchMethod: Constants.MATCH_METHODS.REGEX };
      const word = 'Thi\\S';
      expect(config.addWord(word, options)).to.equal(true);
      expect(Object.keys(config.words)).to.include(word);
      expect(config.words[word].matchMethod).to.equal(Constants.MATCH_METHODS.REGEX);
    });

    it('should return false when word is already present', function () {
      expect(config.addWord('anotherWord')).to.equal(true);
      expect(config.addWord('anotherWord')).to.equal(false);
    });
  });

  describe('removeWord()', function () {
    let config;
    beforeEach(function () {
      config = new Config(Config._defaults);
      config.words = Object.assign({}, Config._defaultWords);
    });

    it('should remove an existing word', function () {
      const wordKey = 'newword';
      config.addWord(wordKey);
      expect(config.words[wordKey]).to.exist;
      expect(config.removeWord(wordKey)).to.equal(true);
      expect(config.words[wordKey]).to.not.exist;
    });

    it('should remove a case-sensitive regex word', function () {
      const wordKey = 'newWord';
      config.addWord(wordKey, { lists: [], matchMethod: Constants.MATCH_METHODS.REGEX });
      expect(config.words[wordKey]).to.exist;
      expect(config.removeWord(wordKey)).to.equal(true);
      expect(config.words[wordKey]).to.not.exist;
    });

    it('should return false when no word to remove', function () {
      const wordKey = 'nonexistant';
      expect(config.words[wordKey]).to.not.exist;
      expect(config.removeWord(wordKey)).to.equal(false);
    });
  });

  describe('repeatForWord()', function () {
    const config = new Config(Config._defaults);
    config.words = Object.assign({}, Config._defaultWords);

    it('should return the repeat option for a word', function () {
      config.words['newWord'] = { matchMethod: config.defaultWordMatchMethod, repeat: Constants.TRUE, words: [] };
      expect(config.repeatForWord('newWord')).to.eql(Constants.TRUE);
      config.words['anotherNewWord'] = {
        matchMethod: config.defaultWordMatchMethod,
        repeat: Constants.FALSE,
        words: [],
      };
      expect(config.repeatForWord('anotherNewWord')).to.eql(Constants.FALSE);
    });

    it('should return the default word repeat when not present on word', function () {
      config.words['evenAnotherWord'] = { matchMethod: config.defaultWordMatchMethod, words: [] };
      expect(config.repeatForWord('evenAnotherWord')).to.eql(config.defaultWordRepeat);
    });
  });

  describe('sanitizeWords()', function () {
    const config = new Config(Config._defaults);
    config.words = Object.assign({}, Config._defaultWords);

    it('should sanitize words', function () {
      config.words['newWord '] = {
        matchMethod: config.defaultWordMatchMethod,
        repeat: config.defaultWordRepeat,
        words: [],
      };
      expect(Object.keys(config.words)).to.include('newWord ');
      expect(Object.keys(config.words)).to.not.include('newword');
      config.sanitizeWords();
      expect(Object.keys(config.words)).to.include('newword');
      expect(Object.keys(config.words)).to.not.include('newWord ');
    });
  });
});
