import { expect } from 'chai';
import OptionPage from '@APF/OptionPage';

describe('OptionPage', function () {
  describe('importedConfigData()', function () {
    const stub = { log: { info() {} }, t: (key: string) => key } as unknown as OptionPage;
    const importedConfigData = (data) => OptionPage.prototype.importedConfigData.call(stub, data);

    it('should return a normal exported config unchanged', function () {
      const data = { filterMethod: 1, words: { test: {} } };
      expect(importedConfigData(data)).to.equal(data);
    });

    it('should unwrap the config from a storage recovery backup', function () {
      const config = { filterMethod: 1, words: { test: {} } };
      const data = { _storageRecovery: { recoveredAt: '2026-10-04' }, config: config, local: {}, sync: {} };
      expect(importedConfigData(data)).to.equal(config);
    });

    it('should throw when a storage recovery backup has no readable settings', function () {
      const data = { _storageRecovery: { recoveredAt: '2026-10-04' }, config: {}, local: {}, sync: {} };
      expect(() => importedConfigData(data)).to.throw();
    });
  });
});
