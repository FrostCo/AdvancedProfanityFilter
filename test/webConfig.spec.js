const expect = require('chai').expect;
import Config from './built/webConfig';

describe('WebConfig', function() {
  it('should throw when no async_params provided', function() {
    expect(() => (new WebConfig)).to.throw();
  });

  describe('combineWords()', function() {
    let config = new Config(Config._defaults);
    config.words = Object.assign({}, Config._defaultWords);

    it('should add a new word to the config', function() {

    });
  });

  describe('dataToPersist()', function() {
  });

  describe('repeatForWord()', function() {
  });

  describe('sanitizeWords()', function() {
  });

  describe('splitWords()', function() {
  });
});