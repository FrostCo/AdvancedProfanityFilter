const expect = require('chai').expect;
import Config from '../../built/lib/config';

describe('Config', function() {
  describe('constructor()', function() {
    it('should create a new Config instance with the provided async_params', function() {
      let config = new Config(Config._defaults);
      expect(config instanceof Config).to.equal(true);
    });

    it('should throw when no async_params provided', function() {
      expect(() => (new Config)).to.throw();
    });
  });

  describe('addWord()', function() {
    let config = new Config(Config._defaults);
    config.words = Object.assign({}, Config._defaultWords);

    it('should add a new word to the config', function() {
      expect(config.addWord('newword')).to.equal(true);
      expect(Object.keys(config.words)).to.include('newword');
      expect(config.words['newword'].matchMethod).to.equal(config.defaultWordMatchMethod);
      expect(config.words['newword'].repeat).to.equal(config.defaultWordRepeat);
      expect(config.words['newword'].sub).to.equal('');
    });

    it('should add a new word to the config with provided options', function() {
      let wordOptions = {matchMethod: 1, repeat: true, sub: 'Older-word'};
      expect(config.addWord('newer-word', wordOptions)).to.equal(true);
      expect(Object.keys(config.words)).to.include('newer-word');
      expect(config.words['newer-word'].matchMethod).to.equal(wordOptions.matchMethod);
      expect(config.words['newer-word'].repeat).to.equal(wordOptions.repeat);
      expect(config.words['newer-word'].sub).to.equal(wordOptions.sub.toLowerCase());
    });

    it('should sanitize a new word before adding', function() {
      expect(config.addWord('anotherNewWord')).to.equal(true);
      expect(Object.keys(config.words)).to.include('anothernewword');
      expect(config.words['anothernewword'].matchMethod).to.equal(config.defaultWordMatchMethod);
      expect(config.words['anothernewword'].repeat).to.equal(config.defaultWordRepeat);
      expect(config.words['anothernewword'].sub).to.equal('');
    });

    it('should return false when word is already present', function() {
      expect(config.addWord('anotherWord')).to.equal(true);
      expect(config.addWord('anotherWord')).to.equal(false);
    });
  });

  describe('repeatForWord()', function() {
    let config = new Config(Config._defaults);
    config.words = Object.assign({}, Config._defaultWords);

    it('should return the repeat option for a word', function() {
      config.words['newWord'] = {matchMethod: config.defaultWordMatchMethod, repeat: true, words: []};
      expect(config.repeatForWord('newWord')).to.eql(true);
      config.words['anotherNewWord'] = {matchMethod: config.defaultWordMatchMethod, repeat: false, words: []};
      expect(config.repeatForWord('anotherNewWord')).to.eql(false);
    });

    it('should return the default word repeat when not present on word', function() {
      config.words['evenAnotherWord'] = {matchMethod: config.defaultWordMatchMethod, words: []};
      expect(config.repeatForWord('evenAnotherWord')).to.eql(config.defaultWordRepeat);
    });
  });

  describe('sanitizeWords()', function() {
    let config = new Config(Config._defaults);
    config.words = Object.assign({}, Config._defaultWords);

    it('should sanitize words', function() {
      config.words['newWord '] = {matchMethod: config.defaultWordMatchMethod, repeat: config.defaultWordRepeat, words: []};
      expect(Object.keys(config.words)).to.include('newWord ');
      expect(Object.keys(config.words)).to.not.include('newword');
      config.sanitizeWords();
      expect(Object.keys(config.words)).to.include('newword');
      expect(Object.keys(config.words)).to.not.include('newWord ');
    });
  });
});