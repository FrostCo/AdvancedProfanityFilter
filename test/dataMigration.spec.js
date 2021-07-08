import { expect } from 'chai';
import Constants from './built/lib/constants';
import DataMigration from './built/dataMigration';
import WebConfig from './built/webConfig';

describe('DataMigration', function() {
  describe('addWordlistsToWords()', function() {
    it('should add wordlist to all words', function() {
      const cfg = {
        words: {
          'test': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'tset' },
          'another': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'tset' },
          'testWithList': { lists: [1, 3, 5], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'tset' },
        }
      };
      const dataMigration = new DataMigration(cfg);
      dataMigration.addWordlistsToWords();
      expect(cfg.words['test'].lists).to.eql([]);
      expect(cfg.words['another'].lists).to.eql([]);
      expect(cfg.words['testWithList'].lists).to.eql([1, 3, 5]);
    });
  });

  describe('removeGlobalMatchMethod()', function() {
    it('should remove global match method and adjust RegExp method', function() {
      const data = {
        words: {
          'test': { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'tset' },
          'another': { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: false, sub: 'tset' },
          'testWithList': { lists: [1, 3, 5], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'tset' },
          '^myRegexp$': { lists: [1, 3, 5], matchMethod: 4, repeat: true, separators: false, sub: 'tset' },
        },
        globalMatchMethod: 3,
      };
      const cfg = new WebConfig(data);
      cfg.remove = (prop) => { delete cfg[prop]; return true; }; // TODO: Find a good way to mock chrome.*
      const dataMigration = new DataMigration(cfg);
      dataMigration.removeGlobalMatchMethod();
      expect(cfg.words['test'].matchMethod).to.eql(Constants.MATCH_METHODS.EXACT);
      expect(cfg.words['another'].matchMethod).to.eql(Constants.MATCH_METHODS.PARTIAL);
      expect(cfg.words['testWithList'].matchMethod).to.eql(Constants.MATCH_METHODS.EXACT);
      expect(cfg.words['^myRegexp$'].matchMethod).to.eql(Constants.MATCH_METHODS.REGEX);
      expect(cfg.globalMatchMethod).to.not.exist;
    });
  });

  describe('removeOldDomainArrays()', function() {
    it('should migrate all old domain arrays', function() {
      const cfg = {
        advancedDomains: ['example.com', 'www.example.com'],
        disabledDomains: ['test.com', 'test.org'],
        domains: {},
        enabledDomains: ['enabled.com', 'example.com'],
      };
      const dataMigration = new DataMigration(cfg);
      dataMigration.removeOldDomainArrays();
      expect(cfg.advancedDomains).to.be.undefined;
      expect(cfg.disabledDomains).to.be.undefined;
      expect(cfg.enabledDomains).to.be.undefined;
      expect(Object.keys(cfg.domains).length).to.equal(5);
      expect(cfg.domains['example.com'].adv).to.be.true;
      expect(cfg.domains['example.com'].enabled).to.be.true;
      expect(cfg.domains['test.org'].disabled).to.be.true;
      expect(cfg.domains['test.org'].adv).to.be.undefined;
    });
  });
});
