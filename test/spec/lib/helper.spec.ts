import { expect } from 'chai';
import Constants from '@APF/lib/constants';
import {
  booleanToNumber,
  formatNumber,
  getParent,
  getVersion,
  hmsToSeconds,
  isVersionOlder,
  lastElement,
  numberToBoolean,
  removeFromArray,
  secondsToHMS,
  timeForFileName,
} from '@APF/lib/helper';

const array = ['a', 'needle', 'in', 'a', 'large', 'haystack'];

describe('Helper', function() {
  describe('booleanToNumber()', function() {
    it('Return a number from a boolean', function() {
      expect(booleanToNumber(true)).to.eql(Constants.TRUE);
      expect(booleanToNumber(false)).to.eql(Constants.FALSE);
      expect(booleanToNumber(undefined)).to.eql(Constants.FALSE);
      expect(booleanToNumber(null)).to.eql(Constants.FALSE);
    });
  });

  describe('formatNumber()', function() {
    it('Format numbers for counter display', function() {
      expect(formatNumber(999)).to.eql('999');
      expect(formatNumber(1000)).to.eql('1k');
      expect(formatNumber(1499)).to.eql('1.4k');
      expect(formatNumber(1500)).to.eql('1.5k');
      expect(formatNumber(9999)).to.eql('9.9k');
      expect(formatNumber(10000)).to.eql('10k');
      expect(formatNumber(500000)).to.eql('500k');
      expect(formatNumber(999499)).to.eql('999k');
      expect(formatNumber(999999)).to.eql('999k');
      expect(formatNumber(1000000)).to.eql('1M');
      expect(formatNumber(1200000)).to.eql('1.2M');
      expect(formatNumber(994999999)).to.eql('994M');
      expect(formatNumber(999999999)).to.eql('999M');
      expect(formatNumber(1000000000)).to.eql('1G+');
      expect(formatNumber(9999999999)).to.eql('1G+');
    });
  });

  describe('getParent()', function() {
    const elements = {
      textContent: 'child',
      parentElement: {
        textContent: 'parent',
        parentElement: {
          textContent: 'grandparent',
          parentElement: {
            textContent: 'great-grandparent',
            parentElement: {
              textContent: 'great-great-grandparent',
            },
          },
        },
      },
    };
    const child = elements;

    it('Get parent', function() {
      expect(child.textContent == 'child');
      expect(getParent(child).textContent).to.eql('parent');
      expect(getParent(child, 1).textContent).to.eql('parent');
    });

    it('Get grandparent', function() {
      expect(getParent(child, 2).textContent).to.eql('grandparent');
    });

    it('Get great-grandparent', function() {
      expect(getParent(child, 3).textContent).to.eql('great-grandparent');
    });

    it('Get great-great-grandparent', function() {
      expect(getParent(child, 4).textContent).to.eql('great-great-grandparent');
    });

    it('no parent', function() {
      expect(getParent(child, 5)).to.be.null;
      expect(getParent(child, 6)).to.be.null;
    });
  });

  describe('hmsToSeconds()', function() {
    it('Convert HH:MM:SS.mmm to seconds', function() {
      expect(hmsToSeconds('0:00:11.97')).to.eql(11.97);
      expect(hmsToSeconds('0:00:17')).to.eql(17);
      expect(hmsToSeconds('0:02:33.09')).to.eql(153.09);
      expect(hmsToSeconds('0:12:26.59')).to.eql(746.59);
      expect(hmsToSeconds('0:23:18.39')).to.eql(1398.39);
      expect(hmsToSeconds('0:28:12.591')).to.eql(1692.591);
      expect(hmsToSeconds('0:28:12.599')).to.eql(1692.599);
      expect(hmsToSeconds('00:05:55.55')).to.eql(355.55);
      expect(hmsToSeconds('1:22:17.79')).to.eql(4937.79);
      expect(hmsToSeconds('3:00:18.500')).to.eql(10818.5);
    });
  });

  describe('isVersionOlder()', function() {
    it('should return true when provided version is older than minimum', function() {
      let version = getVersion('1.1.10');
      let minimum = getVersion('1.2.15');
      expect(isVersionOlder(version, minimum)).to.equal(true);

      version = getVersion('1.1.0');
      minimum = getVersion('1.2.15');
      expect(isVersionOlder(version, minimum)).to.equal(true);

      version = getVersion('1.4.0');
      minimum = getVersion('4.6.15');
      expect(isVersionOlder(version, minimum)).to.equal(true);

      version = getVersion('1.5.15');
      minimum = getVersion('2.3.10');
      expect(isVersionOlder(version, minimum)).to.equal(true);

      version = getVersion('1.5.10');
      minimum = getVersion('1.5.11');
      expect(isVersionOlder(version, minimum)).to.equal(true);
    });

    it('should return false when provided version is not older than minimum', function() {
      let version = getVersion('1.5.10');
      let minimum = getVersion('1.2.1');
      expect(isVersionOlder(version, minimum)).to.equal(false);

      version = getVersion('1.1.0');
      minimum = getVersion('1.0.15');
      expect(isVersionOlder(version, minimum)).to.equal(false);

      version = getVersion('1.0.15');
      minimum = getVersion('1.0.13');
      expect(isVersionOlder(version, minimum)).to.equal(false);

      version = getVersion('3.2.15');
      minimum = getVersion('1.0.13');
      expect(isVersionOlder(version, minimum)).to.equal(false);

      version = getVersion('1.3.0');
      minimum = getVersion('1.2.12');
      expect(isVersionOlder(version, minimum)).to.equal(false);

      version = getVersion('1.5.10');
      minimum = getVersion('1.5.10');
      expect(isVersionOlder(version, minimum)).to.equal(false);

      version = getVersion('1.5.11');
      minimum = getVersion('1.5.10');
      expect(isVersionOlder(version, minimum)).to.equal(false);
    });
  });

  describe('lastElement()', function() {
    it('Returns last element in array', function() {
      expect(lastElement([1])).to.eql(1);
      expect(lastElement([1, 2, 3])).to.eql(3);
      expect(lastElement([])).to.eql(undefined);
    });
  });

  describe('numberToBoolean()', function() {
    it('Return a boolean from a number', function() {
      expect(numberToBoolean(Constants.FALSE)).to.eql(false);
      expect(numberToBoolean(Constants.TRUE)).to.eql(true);
      expect(numberToBoolean(5)).to.eql(true);
      expect(numberToBoolean(undefined)).to.eql(false);
      expect(numberToBoolean(null)).to.eql(false);
    });
  });

  describe('removeFromArray()', function() {
    it('should return an array with the matching element removed', function() {
      expect(removeFromArray(array, 'needle')).to.eql(['a', 'in', 'a', 'large', 'haystack']);
    });

    it('should return an array with the same values if no match is found', function() {
      expect(removeFromArray(array, 'pin')).to.eql(array);
    });
  });

  describe('secondsToHMS()', function() {
    it('Convert seconds to HH:MM:SS.mmm', function() {
      expect(secondsToHMS(11.97)).to.eql('00:00:11.970');
      expect(secondsToHMS(17)).to.eql('00:00:17.000');
      expect(secondsToHMS(153.09)).to.eql('00:02:33.090');
      expect(secondsToHMS(746.59)).to.eql('00:12:26.590');
      expect(secondsToHMS(1398.39)).to.eql('00:23:18.390');
      expect(secondsToHMS(1692.591)).to.eql('00:28:12.591');
      expect(secondsToHMS(1692.599)).to.eql('00:28:12.599');
      expect(secondsToHMS(355.55)).to.eql('00:05:55.550');
      expect(secondsToHMS(4937.79)).to.eql('01:22:17.790');
      expect(secondsToHMS(10818.5)).to.eql('03:00:18.500');
    });
  });

  describe('timeForFileName()', function() {
    it('Returns time string', function() {
      expect(timeForFileName()).to.match(/\d{4}-\d{2}-\d{2}_\d{6}/);
    });
  });
});
