const expect = require('chai').expect;
// import * as bundle from '../dist/filter.bundle';
import WebConfig from '../dist/webConfig';
import WebFilter from '../dist/webFilter';

describe('WebFilter', function() {
  describe('disabledPage()', function() {
    let filter = new WebFilter;
    filter.cfg = new WebConfig({ disabledDomains: ['example.com', 'sub.sample.com'] });

    // Setup mock window/document
    let location = { hostname: 'example.com' };
    global.window = { parent: { location: location }, location: location };
    global.document = { location: location, referrer: 'sample.com' };
    filter.getTestHostname = () => (window.location == window.parent.location) ? document.location.hostname : new URL(document.referrer).hostname;
    filter.hostname = filter.getTestHostname();

    it('should return true when on a disabled domain', function() {
      expect(filter.disabledPage()).to.equal(true);
    });

    it('should return false when not on a disabled domain', function() {
      location.hostname = 'sample.com';
      filter.hostname = filter.getTestHostname();
      expect(filter.disabledPage()).to.equal(false);
    });

    it('should return true when on a subdomain of a disabled parent domain', function() {
      location.hostname = 'sub.example.com';
      filter.hostname = filter.getTestHostname();
      expect(filter.disabledPage()).to.equal(true);
    });
  });
});