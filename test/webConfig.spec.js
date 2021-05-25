import { expect } from 'chai';
import Constants from './built/lib/constants';
import WebConfig from './built/webConfig';

describe('WebConfig', function() {
  it('should throw when no async_params provided', function() {
    expect(() => (new WebConfig)).to.throw();
  });

  describe('.combineData()', function() {
    it('should combine _domain# data', function() {
      const config = new WebConfig(WebConfig._defaults);
      delete config.domains;
      config._splitContainerKeys = ['domains'];
      config._domains0 = { 'www.example0.com': { 'adv': true } };
      config._domains1 = { 'www.example1.com': { 'adv': true } };
      expect(config.domain).to.not.exist;
      const combinedKeys = WebConfig.combineData(config, 'domains');
      expect(combinedKeys).to.eql(['_domains0', '_domains1']);
      expect(config.domains['www.example0.com'].adv).to.be.true;
      expect(config.domains['www.example1.com'].adv).to.be.true;
      expect(config._domains0).to.not.exist;
      expect(config._domains1).to.not.exist;
    });

    it('should combine _words# data', function() {
      const config = new WebConfig(WebConfig._defaults);
      config._words0 = WebConfig._defaultWords;
      config._words1 = { 'test': { lists: [], matchMethod: Constants.MATCH_METHODS.EXACT, repeat: true, separators: false, sub: 'tset' } };
      config._splitContainerKeys = ['words'];
      expect(config.words).to.not.exist;
      const combinedKeys = WebConfig.combineData(config, 'words');
      expect(combinedKeys).to.eql(['_words0', '_words1']);
      expect(config.words['test'].matchMethod).to.eq(Constants.MATCH_METHODS.EXACT);
      expect(config.words[Object.keys(WebConfig._defaultWords)[0]]).to.exist;
      expect(config.words['undefined']).to.not.exist;
      expect(config._words0).to.not.exist;
      expect(config._words1).to.not.exist;
    });
  });

  describe('.getDataContainerKeys()', function() {
    it('should return all matches', function() {
      const config = new WebConfig(WebConfig._defaults);
      delete config.domains;
      config._domains0 = { 'www.example0.com': { 'adv': true } };
      config._domains1 = { 'www.example1.com': { 'adv': true } };
      expect(WebConfig.getDataContainerKeys(config, 'domains')).to.eql(['_domains0', '_domains1']);
    });

    it('should return no matches if none', function() {
      const config = new WebConfig(WebConfig._defaults);
      expect(WebConfig.getDataContainerKeys(config, 'domains')).to.eql([]);
    });
  });

  describe('ordered()', function() {
    it('remove "_" prefix values', function() {
      const config = new WebConfig(WebConfig._defaults);
      expect(config._splitContainerKeys).to.exist;
      expect(config.ordered()._splitContainerKeys).to.not.exist;
    });
  });

  describe('splitData()', function() {
    const encoder = new TextEncoder();

    it('should split data on _splittingKeys', function() {
      const config = new WebConfig(WebConfig._defaults);
      const domains = {};
      let domainsLength = 0;
      const testingMax = WebConfig._maxBytes * 1.1;

      for (let i = 0; domainsLength < testingMax; i++) {
        domains[`www.example${i}.com`] = { adv: true, wordlist: 2, audioList: 3 };
        domainsLength = encoder.encode(JSON.stringify(domains)).length;
      }

      config.domains = domains;
      const count = Object.keys(config.domains).length;
      expect(config._domains0).to.be.undefined;
      const data = config.splitData('domains');
      expect(Object.keys(data._domains0).length).to.be.gt(0);
      expect(Object.keys(data._domains0).length).to.be.lt(count);
      expect(Object.keys(data._domains0).length + Object.keys(data._domains1).length).to.eq(count);
    });

    it('should not split when under max', function() {
      const config = new WebConfig(WebConfig._defaults);
      const domains = {};
      let domainsLength = 0;
      const testingMax = WebConfig._maxBytes * 0.5;

      for (let i = 0; domainsLength < testingMax; i++) {
        domains[`www.example${i}.com`] = { adv: true, wordlist: 2, audioList: 3 };
        domainsLength = encoder.encode(JSON.stringify(domains)).length;
      }

      config.domains = domains;
      const count = Object.keys(config.domains).length;
      const data = config.splitData('domains');
      expect(Object.keys(data._domains0).length).to.eq(count);
      expect(data._domains1).to.be.undefined;
    });
  });
});