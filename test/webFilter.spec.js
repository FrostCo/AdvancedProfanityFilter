const expect = require('chai').expect;
// import * as bundle from '../built/filter.bundle';
import WebConfig from './built/webConfig';
import WebFilter from './built/webFilter';

describe('WebFilter', function() {
  describe('disabledPage()', function() {
    let filter = new WebFilter;
    filter.cfg = new WebConfig({ disabledDomains: ['example.com', 'sub.sample.com'] });
    global.window = { location: { hostname: 'example.com' } };

    it('should return true when on a disabled domain', function() {
      expect(filter.disabledPage()).to.equal(true);
    });

    it('should return false when not on a disabled domain', function() {
      global.window.location.hostname = 'sample.com';
      expect(filter.disabledPage()).to.equal(false);
    });

    it('should return true when on a subdomain of a disabled parent domain', function() {
      global.window.location.hostname = 'sub.example.com';
      expect(filter.disabledPage()).to.equal(true);
    });
  });
});