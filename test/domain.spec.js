const expect = require('chai').expect;
import Domain from '../dist/domain';

const domains = ['example.com', 'sub.example.com', 'alt.example.com', 'another.sample.com'];

describe('Domain', function() {
  describe('domainMatch()', function() {
    it('should return true when a matching domain is found', function() {
      expect(Domain.domainMatch('example.com', domains)).to.equal(true);
    });

    it('should return true when a parent domain is found', function() {
      expect(Domain.domainMatch('other.example.com', domains)).to.equal(true);
    });

    it('should return false when a more specific (subdomain) domain is listed', function() {
      expect(Domain.domainMatch('sample.com', domains)).to.equal(false);
    });

    it('should return false on an empty list of domains', function() {
      expect(Domain.domainMatch('example.com', [])).to.equal(false);
    });
  });

  describe('removeFromList()', function() {
    it('should remove parent domain and not subdomains when give a parent domain', function() {
      expect(Domain.removeFromList('example.com', domains)).to.eql(['sub.example.com', 'alt.example.com', 'another.sample.com']);
    });

    it('should remove the specific subdomain and parent domain provided', function() {
      expect(Domain.removeFromList('sub.example.com', domains)).to.eql(['alt.example.com', 'another.sample.com']);
    });

    it('should only remove the specific subdomain when no matching parent', function() {
      expect(Domain.removeFromList('another.sample.com', domains)).to.eql(['example.com', 'sub.example.com', 'alt.example.com']);
    });

    it('should not remove any domains when no matches are found', function() {
      expect(Domain.removeFromList('sub.sample.com', domains)).to.eql(domains);
    });
  });
});