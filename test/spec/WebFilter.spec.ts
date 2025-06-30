import { expect } from 'chai';
import Domain from '@APF/Domain';
import WebConfig from '@APF/WebConfig';
import WebFilter from '@APF/WebFilter';

describe('WebFilter', function () {
  describe('domains', function () {
    const filter = new WebFilter();
    filter.cfg = new WebConfig({
      domains: {
        /* eslint-disable @typescript-eslint/naming-convention */
        'example.com': { disabled: true },
        'sub.sample.com': { adv: true },
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    });

    // Setup mock window/document
    const location = { hostname: 'example.com' };
    global.window = { parent: { location: location }, location: location };
    global.document = { location: location, referrer: 'sample.com' };
    filter.getTestHostname = () =>
      window.location == window.parent.location ? document.location.hostname : new URL(document.referrer).hostname;
    filter.hostname = filter.getTestHostname();

    it('should be disabled when parent domain is disabled', function () {
      filter.domain = Domain.byHostname('www.example.com', filter.cfg.domains);
      expect(filter.domain.disabled).to.be.true;
    });

    it('should not be disabled and be advanced', function () {
      filter.domain = Domain.byHostname('sub.sample.com', filter.cfg.domains);
      expect(filter.domain.disabled).to.be.undefined;
      expect(filter.domain.advanced).to.be.true;
    });
  });
});
