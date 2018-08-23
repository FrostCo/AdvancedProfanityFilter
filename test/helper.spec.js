const expect = require('chai').expect;
import { arrayContains, dynamicContains, removeFromArray } from '../dist/helper';

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
});