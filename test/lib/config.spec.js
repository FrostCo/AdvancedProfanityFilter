const expect = require('chai').expect;
import Config from '../../dist/lib/config';

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
      expect(config.addWord('newWord')).to.equal(true);
      expect(Object.keys(config.words)).to.include('newWord');
      expect(config.words['newWord'].matchMethod).to.equal(config.defaultWordMatchMethod);
      expect(config.words['newWord'].repeat).to.equal(config.defaultWordRepeat);
      expect(config.words['newWord'].words).to.eql([]);
    });

    it('should return false when word is already present', function() {
      expect(config.addWord('anotherWord')).to.equal(true);
      expect(config.addWord('anotherWord')).to.equal(false);
    });
  });
});