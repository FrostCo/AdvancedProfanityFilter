import { expect } from 'chai';
import Constants from '@APF/lib/Constants';
import DataMigration from '@APF/DataMigration';
import WebConfig from '@APF/WebConfig';

describe('DataMigration', function () {
  describe('_renameConfigKeys()', function () {
    it('should migrate to allowlists', function () {
      const cfg = {
        iWordAllowlist: WebConfig._defaults.iWordAllowlist,
        wordAllowlist: WebConfig._defaults.wordAllowlist,
      };
      const oldCfg = {
        iWordWhitelist: ['ALLCAPS', 'LOUD NOISES'],
        wordWhitelist: ['allowed'],
      };
      const mapping = { iWordWhitelist: 'iWordAllowlist', wordWhitelist: 'wordAllowlist' };
      const oldKeys = Object.keys(mapping);
      const dataMigration = new DataMigration(cfg);
      dataMigration._renameConfigKeys(oldCfg, oldKeys, mapping);
      expect(cfg.iWordAllowlist.length).to.equal(2);
      expect(cfg.wordAllowlist.length).to.equal(1);
      expect(cfg.iWordAllowlist[0]).to.equal('ALLCAPS');
      expect(cfg.wordAllowlist[0]).to.equal('allowed');
    });
  });

  // 2.7.0
  describe('addWordlistsToWords()', function () {
    it('should add wordlist to all words', function () {
      const cfg = {
        words: {
          test: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'tset' },
          another: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'tset' },
          testWithList: {
            lists: [1, 3, 5],
            matchMethod: Constants.MATCH_METHODS.EXACT,
            repeat: true,
            separators: false,
            sub: 'tset',
          },
        },
      };
      const dataMigration = new DataMigration(cfg);
      dataMigration.addWordlistsToWords();
      expect(cfg.words['test'].lists).to.eql([]);
      expect(cfg.words['another'].lists).to.eql([]);
      expect(cfg.words['testWithList'].lists).to.eql([1, 3, 5]);
    });
  });

  // 2.7.0
  describe('removeGlobalMatchMethod()', function () {
    it('should remove global match method and adjust RegExp method', function () {
      const data = {
        words: {
          test: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'tset' },
          another: { matchMethod: Constants.MATCH_METHODS.PARTIAL, repeat: true, separators: false, sub: 'tset' },
          testWithList: {
            lists: [1, 3, 5],
            matchMethod: Constants.MATCH_METHODS.EXACT,
            repeat: true,
            separators: false,
            sub: 'tset',
          },
          /* eslint-disable-next-line @typescript-eslint/naming-convention */
          '^myRegexp$': { lists: [1, 3, 5], matchMethod: 4, repeat: true, separators: false, sub: 'tset' },
        },
        globalMatchMethod: 3,
      };
      const cfg = new WebConfig(data);
      cfg.remove = (prop) => {
        delete cfg[prop];
        return true;
      }; // TODO: Find a good way to mock chrome.*
      const dataMigration = new DataMigration(cfg);
      dataMigration.removeGlobalMatchMethod();
      expect(cfg.words['test'].matchMethod).to.eql(Constants.MATCH_METHODS.EXACT);
      expect(cfg.words['another'].matchMethod).to.eql(Constants.MATCH_METHODS.PARTIAL);
      expect(cfg.words['testWithList'].matchMethod).to.eql(Constants.MATCH_METHODS.EXACT);
      expect(cfg.words['^myRegexp$'].matchMethod).to.eql(Constants.MATCH_METHODS.REGEX);
      expect(cfg.globalMatchMethod).to.not.exist;
    });
  });

  // 2.7.0
  describe('removeOldDomainArrays()', function () {
    it('should migrate all old domain arrays', function () {
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

  // 2.20.0
  describe('updateWordRepeatAndSeparatorDataTypes()', function () {
    describe('convert repeat and separators to numbers', function () {
      const data = {
        words: {
          test: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: false, separators: false, sub: 'tset' },
          another: { matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: true, sub: 'tset' },
          testWithList: {
            lists: [1, 3, 5],
            matchMethod: Constants.MATCH_METHODS.EXACT,
            repeat: true,
            separators: false,
            sub: 'tset',
          },
          withoutRepeat: {
            lists: [1, 3, 5],
            matchMethod: Constants.MATCH_METHODS.EXACT,
            separators: true,
            sub: 'tset',
          },
        },
      };
      const cfg = new WebConfig(data);
      const dataMigration = new DataMigration(cfg);
      dataMigration.updateWordRepeatAndSeparatorDataTypes();

      it('when both are false', function () {
        expect(cfg.words['test'].repeat).to.equal(Constants.FALSE);
        expect(cfg.words['test'].separators).to.equal(Constants.FALSE);
      });

      it('when both are false', function () {
        expect(cfg.words['another'].repeat).to.equal(Constants.TRUE);
        expect(cfg.words['another'].separators).to.equal(Constants.TRUE);
      });

      it('when repeat is true and separators is false', function () {
        expect(cfg.words['testWithList'].repeat).to.equal(Constants.TRUE);
        expect(cfg.words['testWithList'].separators).to.equal(Constants.FALSE);
      });

      it('when repeat is not present and separators is true', function () {
        expect(cfg.words['withoutRepeat'].repeat).to.equal(Constants.FALSE);
        expect(cfg.words['withoutRepeat'].separators).to.equal(Constants.TRUE);
      });
    });
  });

  // 2.40.0
  describe('renameToWordAllowlist()', function () {
    it('should migrate to allowlists when populated', async function () {
      const cfg = {
        iWordAllowlist: WebConfig._defaults.iWordAllowlist,
        iWordWhitelist: ['ALLCAPS', 'LOUD NOISES'],
        wordAllowlist: WebConfig._defaults.wordAllowlist,
        wordWhitelist: ['allowed'],
      };
      const dataMigration = new DataMigration(cfg);
      await dataMigration.renameToWordAllowlist();
      expect(cfg.iWordAllowlist.length).to.equal(2);
      expect(cfg.wordAllowlist.length).to.equal(1);
      expect(cfg.iWordAllowlist[0]).to.equal('ALLCAPS');
      expect(cfg.wordAllowlist[0]).to.equal('allowed');
    });

    it('should migrate to allowlists when empty', async function () {
      const cfg = {
        iWordAllowlist: WebConfig._defaults.iWordAllowlist,
        iWordWhitelist: [],
        wordAllowlist: WebConfig._defaults.wordAllowlist,
        wordWhitelist: [],
      };
      const dataMigration = new DataMigration(cfg);
      await dataMigration.renameToWordAllowlist().then(() => {
        expect(cfg.iWordAllowlist.length).to.equal(0);
        expect(cfg.wordAllowlist.length).to.equal(0);
      });
    });
  });
});
