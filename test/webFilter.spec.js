import { expect } from 'chai';
import Domain from './built/domain';
import WebConfig from './built/webConfig';
import WebFilter from './built/webFilter';

describe('WebFilter', function() {
  describe('domains', function() {
    let filter = new WebFilter;
    filter.cfg = new WebConfig({
      domains: {
        'example.com': { disabled: true },
        'sub.sample.com': { adv: true },
      }
    });

    // Setup mock window/document
    let location = { hostname: 'example.com' };
    global.window = { parent: { location: location }, location: location };
    global.document = { location: location, referrer: 'sample.com' };
    filter.getTestHostname = () => (window.location == window.parent.location) ? document.location.hostname : new URL(document.referrer).hostname;
    filter.hostname = filter.getTestHostname();

    it('should be disabled when parent domain is disabled', function() {
      filter.domain = Domain.byHostname('www.example.com', filter.cfg.domains);
      expect(filter.domain.disabled).to.be.true;
    });

    it('should not be disabled and be advanced', function() {
      filter.domain = Domain.byHostname('sub.sample.com', filter.cfg.domains);
      expect(filter.domain.disabled).to.be.undefined;
      expect(filter.domain.advanced).to.be.true;
    });
  });
});