import { expect } from 'chai';
import Constants from '@APF/lib/Constants';

describe('Constants', function () {
  describe('filterMethodName()', function () {
    it('should return filter method name for id', function () {
      expect(Constants.filterMethodName(1)).to.equal('Substitute');
    });
  });

  describe('loggingLevelName()', function () {
    it('should return log level name for id', function () {
      expect(Constants.loggingLevelName(1)).to.equal('INFO');
    });
  });

  describe('matchMethodName()', function () {
    it('should return match method name for id', function () {
      expect(Constants.matchMethodName(1)).to.equal('Partial');
    });
  });

  describe('nameById()', function () {
    it('should return friendly name for id', function () {
      expect(Constants.nameById(Constants.FILTER_METHODS, 1)).to.equal('Substitute');
    });
  });

  describe('nameByValue()', function () {
    it('should return name for id', function () {
      expect(Constants.nameByValue(Constants.LOGGING_LEVELS, 1)).to.equal('INFO');
    });
  });

  describe('orderedArray()', function () {
    it('should return an ordered array with friendly names of a constants object', function () {
      expect(Constants.orderedArray(Constants.FILTER_METHODS)).to.eql(['Censor', 'Substitute', 'Remove', 'Off']);
    });
  });
});
