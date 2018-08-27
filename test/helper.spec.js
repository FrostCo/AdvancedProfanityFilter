const expect = require('chai').expect;
import { arrayContains, dynamicContains, getVersion, isVersionOlder, removeFromArray } from '../dist/helper';

const array = ['a', 'needle', 'in', 'a', 'large', 'haystack'];

describe('Helper', function() {
  describe('arrayContains()', function() {
    it('should return true when a matching element is found', function() {
      expect(arrayContains(array, 'needle')).to.equal(true);
    });

    it('should return false when a matching element is not found', function() {
      expect(arrayContains(array, 'pin')).to.equal(false);
    });

    it('should return false when passing an empty array', function() {
      expect(arrayContains([], 'needle')).to.equal(false);
    });
  });

  // describe('dynamicList()', function() {
  // });

  describe('removeFromArray()', function() {
    it('should return an array with the matching element removed', function() {
      expect(removeFromArray(array, 'needle')).to.eql(['a', 'in', 'a', 'large', 'haystack']);
    });

    it('should return an array with the same values if no match is found', function() {
      expect(removeFromArray(array, 'pin')).to.eql(array);
    });
  });

  describe('isVersionOlder()', function() {
    it('should return true when provided version is older than minimum', function() {
      let minimum = getVersion('1.2.15');
      let version = getVersion('1.1.10');
      expect(isVersionOlder(minimum, version)).to.equal(true);

      minimum = getVersion('1.2.15');
      version = getVersion('1.1.0');
      expect(isVersionOlder(minimum, version)).to.equal(true);

      minimum = getVersion('4.6.15');
      version = getVersion('1.4.0');
      expect(isVersionOlder(minimum, version)).to.equal(true);

      minimum = getVersion('2.3.10');
      version = getVersion('1.5.15');
      expect(isVersionOlder(minimum, version)).to.equal(true);
    });

    it('should return false when provided version is not older than minimum', function() {
      let minimum = getVersion('1.2.15');
      let version = getVersion('1.5.10');
      expect(isVersionOlder(minimum, version)).to.equal(false);

      minimum = getVersion('1.0.15');
      version = getVersion('1.1.0');
      expect(isVersionOlder(minimum, version)).to.equal(false);

      minimum = getVersion('1.0.13');
      version = getVersion('1.0.15');
      expect(isVersionOlder(minimum, version)).to.equal(false);

      minimum = getVersion('1.0.13');
      version = getVersion('3.2.15');
      expect(isVersionOlder(minimum, version)).to.equal(false);

      minimum = getVersion('1.2.12');
      version = getVersion('1.3.0');
      expect(isVersionOlder(minimum, version)).to.equal(false);
    });
  });
});