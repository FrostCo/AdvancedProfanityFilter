const expect = require('chai').expect;
import DataMigration from './built/dataMigration';

describe('DataMigration', function() {
  describe('removeOldDomainArrays()', function() {
    it('should migrate all old domain arrays', function() {
      let cfg = {
        advancedDomains: ['example.com', 'www.example.com'],
        disabledDomains: ['test.com', 'test.org'],
        domains: {},
        enabledDomains: ['enabled.com', 'example.com'],
      };
      let dataMigration = new DataMigration(cfg);
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
