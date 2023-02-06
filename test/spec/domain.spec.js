import { expect } from 'chai';
import Domain from './built/domain';
import WebConfig from './built/webConfig';

/* eslint-disable @typescript-eslint/naming-convention */
const domains = {
  '192.168.0.1': { disabled: false },
  'another.com': { adv: true },
  'a.example.com': { enabled: true },
  'www.example.com': { disabled: true },
  'www.example.co.uk': { disabled: true },
  'localhost': { disabled: false },
  'abc.zoo.edu': { disabled: true },
};
/* eslint-enable @typescript-eslint/naming-convention */

describe('Domain', function() {
  describe('.byKey()', function() {
    it('should give a new domain with defaults if no matching record', function() {
      const cfg = new WebConfig({ domains: domains });
      const key = 'www.example.org';
      const domain = Domain.byKey(key, cfg.domains);
      expect(domain.advanced).to.be.undefined;
      expect(domain.disabled).to.be.undefined;
      expect(domain.enabled).to.be.undefined;
      expect(domain.wordlist).to.be.undefined;
      expect(domain.cfgKey).to.eq(key);
    });

    it('should give a domain with exact domain match', function() {
      const cfg = new WebConfig({ domains: domains });
      const key = 'www.example.com';
      const domain = Domain.byKey(key, cfg.domains);
      expect(domain.advanced).to.be.undefined;
      expect(domain.disabled).to.be.true;
      expect(domain.cfg.disabled).to.be.true;
      expect(domain.enabled).to.be.undefined;
      expect(domain.wordlist).to.be.undefined;
      expect(domain.cfgKey).to.eq(key);
    });

    it('should give return for exact match', function() {
      const cfg = new WebConfig({ domains: domains });
      const key = 'sub.another.com';
      const domain = Domain.byKey(key, cfg.domains);
      expect(domain.advanced).to.be.undefined;
      expect(domain.disabled).to.be.undefined;
      expect(domain.enabled).to.be.undefined;
      expect(domain.wordlist).to.be.undefined;
      expect(domain.cfgKey).to.eq(key);
    });
  });

  describe('.byHostname()', function() {
    it('should give a new domain with defaults if no matching record', function() {
      const cfg = new WebConfig({ domains: domains });
      const hostname = 'www.example.org';
      const domain = Domain.byHostname(hostname, cfg.domains);
      expect(domain.advanced).to.be.undefined;
      expect(domain.disabled).to.be.undefined;
      expect(domain.enabled).to.be.undefined;
      expect(domain.wordlist).to.be.undefined;
      expect(domain.cfgKey).to.eq(hostname);
    });

    it('should give a domain with exact domain match', function() {
      const cfg = new WebConfig({ domains: domains });
      const hostname = 'www.example.com';
      const domain = Domain.byHostname(hostname, cfg.domains);
      expect(domain.advanced).to.be.undefined;
      expect(domain.disabled).to.be.true;
      expect(domain.cfg.disabled).to.be.true;
      expect(domain.enabled).to.be.undefined;
      expect(domain.wordlist).to.be.undefined;
      expect(domain.cfgKey).to.eq(hostname);
    });

    it('should give a parent domain for subdomain', function() {
      const cfg = new WebConfig({ domains: domains });
      const hostname = 'sub.another.com';
      const domain = Domain.byHostname(hostname, cfg.domains);
      expect(domain.advanced).to.be.true;
      expect(domain.cfg.adv).to.be.true;
      expect(domain.disabled).to.be.undefined;
      expect(domain.enabled).to.be.undefined;
      expect(domain.wordlist).to.be.undefined;
      expect(domain.cfgKey).to.eq('another.com');
    });
  });

  describe('.findDomainKey()', function() {
    const cfg = new WebConfig({ domains: domains });
    it('should return an exact match', function() { expect(Domain.findDomainKey('www.example.com', cfg.domains)).to.eq('www.example.com'); });
    it('should match a subdomain of a parent', function() { expect(Domain.findDomainKey('sub.another.com', cfg.domains)).to.eq('another.com'); });
    it('return undefined if no match', function() { expect(Domain.findDomainKey('nowhere.com', cfg.domains)).to.be.undefined; });
  });

  describe('.sortedKeys()', function() {
    const cfg = new WebConfig({ domains: domains });
    it('should sort domains by parent', function() {
      expect(Domain.sortedKeys(cfg.domains)).to.eql([
        '192.168.0.1',
        'another.com',
        'a.example.com',
        'www.example.co.uk',
        'www.example.com',
        'localhost',
        'abc.zoo.edu',
      ]);
    });
  });

  describe('updateCfg()', function() {
    it('should update domain.cfg', function() {
      const domain = new Domain('new.domain.com');
      domain.advanced = true;
      expect(domain.cfg.adv).to.be.undefined;
      domain.updateCfg();
      expect(domain.cfg.adv).to.be.true;
    });
  });

  describe('updateFromCfg()', function() {
    it('should set domain attributes from domain.cfg', function() {
      const domain = new Domain('new.domain.com');
      domain.cfg.adv = true;
      expect(domain.advanced).to.be.undefined;
      domain.updateFromCfg();
      expect(domain.advanced).to.be.true;
    });
  });
});
