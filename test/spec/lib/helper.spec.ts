import { expect } from 'chai';
import Constants from '@APF/lib/Constants';
import {
  booleanToNumber,
  deepCloneJson,
  formatNumber,
  getParent,
  getVersion,
  hasOwn,
  hmsToSeconds,
  isVersionOlder,
  lastElement,
  numberToBoolean,
  numberWithCommas,
  prettyPrintArray,
  randomArrayElement,
  removeFromArray,
  secondsToHMS,
  sortObjectKeys,
  stringArray,
  timeForFileName,
  truncateString,
  upperCaseFirst,
} from '@APF/lib/helper';

const array = ['a', 'needle', 'in', 'a', 'large', 'haystack'];

describe('Helper', function () {
  describe('booleanToNumber()', function () {
    it('Return a number from a boolean', function () {
      expect(booleanToNumber(true)).to.eql(Constants.TRUE);
      expect(booleanToNumber(false)).to.eql(Constants.FALSE);
      expect(booleanToNumber(undefined)).to.eql(Constants.FALSE);
      expect(booleanToNumber(null)).to.eql(Constants.FALSE);
    });
  });

  describe('deepJsonClone()', function () {
    const deepObject = {
      children: {
        deep: false,
        name: 'shallow',
        shallow: true,
      },
      deep: true,
      name: 'deep',
      numbers: [1, 2],
      shallow: false,
      strings: ['one', 'two'],
    };

    const shallowObject = {
      deep: false,
      name: 'shallow',
      shallow: true,
    };

    it('Shallow clones object', function () {
      expect(JSON.stringify(deepCloneJson(shallowObject))).to.eql(JSON.stringify(shallowObject));
    });

    it('Deep clones object', function () {
      expect(JSON.stringify(deepCloneJson(deepObject))).to.eql(JSON.stringify(deepObject));
    });

    it('Is a clone (delete)', function () {
      const clone = deepCloneJson(deepObject);
      delete clone.name;
      expect(clone.name).to.be.undefined;
      expect(deepObject.name).to.not.be.undefined;
    });

    it('Is a clone (update)', function () {
      const clone = deepCloneJson(deepObject);
      const key = 'name2';
      clone[key] = 'deep2';
      expect(clone[key]).to.not.be.undefined;
      expect(deepObject[key]).to.be.undefined;
    });
  });

  describe('formatNumber()', function () {
    it('Format numbers for counter display', function () {
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

  describe('getParent()', function () {
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

    it('Get parent', function () {
      expect(child.textContent == 'child');
      expect(getParent(child).textContent).to.eql('parent');
      expect(getParent(child, 1).textContent).to.eql('parent');
    });

    it('Get grandparent', function () {
      expect(getParent(child, 2).textContent).to.eql('grandparent');
    });

    it('Get great-grandparent', function () {
      expect(getParent(child, 3).textContent).to.eql('great-grandparent');
    });

    it('Get great-great-grandparent', function () {
      expect(getParent(child, 4).textContent).to.eql('great-great-grandparent');
    });

    it('no parent', function () {
      expect(getParent(child, 5)).to.be.null;
      expect(getParent(child, 6)).to.be.null;
    });
  });

  describe('hasOwn()', function () {
    it('should return false for null object', function () {
      expect(hasOwn(null, 'key')).to.be.false;
    });

    it('should return false for undefined object', function () {
      expect(hasOwn(undefined, 'key')).to.be.false;
    });

    it('should return true for own properties', function () {
      const obj = { a: 1, b: 2 };
      expect(hasOwn(obj, 'a')).to.be.true;
      expect(hasOwn(obj, 'b')).to.be.true;
    });

    it('should return false for inherited properties', function () {
      const obj = { a: 1 };
      expect(hasOwn(obj, 'toString')).to.be.false;
      expect(hasOwn(obj, 'constructor')).to.be.false;
      expect(hasOwn(obj, 'valueOf')).to.be.false;
    });

    it('should return false for non-existent properties', function () {
      const obj = { a: 1 };
      expect(hasOwn(obj, 'nonexistent')).to.be.false;
      expect(hasOwn(obj, 'b')).to.be.false;
    });

    it('should work with string keys', function () {
      const obj = { stringKey: 'value' };
      expect(hasOwn(obj, 'stringKey')).to.be.true;
    });

    it('should work with numeric keys', function () {
      const obj = {};
      obj['0'] = 'zero';
      obj['1'] = 'one';
      expect(hasOwn(obj, '0')).to.be.true;
      expect(hasOwn(obj, '1')).to.be.true;
      expect(hasOwn(obj, '2')).to.be.false;
    });

    it('should work with symbol keys', function () {
      const sym = Symbol('test');
      const obj = { [sym]: 'value' };
      expect(hasOwn(obj, sym)).to.be.true;
      expect(hasOwn(obj, Symbol('other'))).to.be.false;
    });

    it('should handle properties with undefined values', function () {
      const obj = { a: undefined };
      expect(hasOwn(obj, 'a')).to.be.true;
    });

    it('should handle properties with null values', function () {
      const obj = { a: null };
      expect(hasOwn(obj, 'a')).to.be.true;
    });

    it('should handle empty object', function () {
      const obj = {};
      expect(hasOwn(obj, 'anyKey')).to.be.false;
    });

    it('should handle objects with prototype properties', function () {
      function testConstructor() {
        this.ownProp = 'value';
      }
      testConstructor.prototype.inheritedProp = 'inherited';

      const obj = new testConstructor();
      expect(hasOwn(obj, 'ownProp')).to.be.true;
      expect(hasOwn(obj, 'inheritedProp')).to.be.false;
    });

    it('should handle objects created with Object.create', function () {
      const proto = { inherited: 'value' };
      const obj = Object.create(proto);
      obj.own = 'ownValue';

      expect(hasOwn(obj, 'own')).to.be.true;
      expect(hasOwn(obj, 'inherited')).to.be.false;
    });

    it('should use fallback when Object.hasOwn is not available', function () {
      // Save original Object.hasOwn
      const originalHasOwn = Object.hasOwn;

      try {
        // Temporarily remove Object.hasOwn
        delete (Object as any).hasOwn;

        const obj = { test: 'value' };
        expect(hasOwn(obj, 'test')).to.be.true;
        expect(hasOwn(obj, 'nonexistent')).to.be.false;
        expect(hasOwn(null, 'key')).to.be.false;
        expect(hasOwn(undefined, 'key')).to.be.false;
      } finally {
        // Restore original Object.hasOwn
        if (originalHasOwn) {
          (Object as any).hasOwn = originalHasOwn;
        }
      }
    });

    it('should use fallback when Object.hasOwn is undefined', function () {
      // Save original Object.hasOwn
      const originalHasOwn = Object.hasOwn;

      try {
        // Set Object.hasOwn to undefined
        (Object as any).hasOwn = undefined;

        const obj = { test: 'value' };
        expect(hasOwn(obj, 'test')).to.be.true;
        expect(hasOwn(obj, 'nonexistent')).to.be.false;
        expect(hasOwn(null, 'key')).to.be.false;
        expect(hasOwn(undefined, 'key')).to.be.false;
      } finally {
        // Restore original Object.hasOwn
        if (originalHasOwn) {
          (Object as any).hasOwn = originalHasOwn;
        }
      }
    });

    it('should use fallback when Object.hasOwn is null', function () {
      // Save original Object.hasOwn
      const originalHasOwn = Object.hasOwn;

      try {
        // Set Object.hasOwn to null
        (Object as any).hasOwn = null;

        const obj = { test: 'value' };
        expect(hasOwn(obj, 'test')).to.be.true;
        expect(hasOwn(obj, 'nonexistent')).to.be.false;
        expect(hasOwn(null, 'key')).to.be.false;
        expect(hasOwn(undefined, 'key')).to.be.false;
      } finally {
        // Restore original Object.hasOwn
        if (originalHasOwn) {
          (Object as any).hasOwn = originalHasOwn;
        }
      }
    });
  });

  describe('hmsToSeconds()', function () {
    it('Convert HH:MM:SS.mmm to seconds', function () {
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

    it('should handle empty input string', function () {
      expect(hmsToSeconds('')).to.eql(0);
    });
  });

  describe('isVersionOlder()', function () {
    it('should return true when provided version is older than minimum', function () {
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

    it('should return false when provided version is not older than minimum', function () {
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

  describe('lastElement()', function () {
    it('Returns last element in array', function () {
      expect(lastElement([1])).to.eql(1);
      expect(lastElement([1, 2, 3])).to.eql(3);
      expect(lastElement([])).to.eql(undefined);
    });
  });

  describe('numberToBoolean()', function () {
    it('Return a boolean from a number', function () {
      expect(numberToBoolean(Constants.FALSE)).to.eql(false);
      expect(numberToBoolean(Constants.TRUE)).to.eql(true);
      expect(numberToBoolean(5)).to.eql(true);
      expect(numberToBoolean(undefined)).to.eql(false);
      expect(numberToBoolean(null)).to.eql(false);
    });
  });

  describe('numberWithCommas()', function () {
    it('Works with numbers', function () {
      expect(numberWithCommas(123)).to.eql('123');
      expect(numberWithCommas(1234)).to.eql('1,234');
      expect(numberWithCommas(1234567890)).to.eql('1,234,567,890');
      expect(numberWithCommas(0)).to.eql('0');
      expect(numberWithCommas(-1234)).to.eql('-1,234');
    });

    it('Works with number string', function () {
      expect(numberWithCommas('123')).to.eql('123');
      expect(numberWithCommas('1234')).to.eql('1,234');
      expect(numberWithCommas('1234567890')).to.eql('1,234,567,890');
      expect(numberWithCommas('0')).to.eql('0');
      expect(numberWithCommas('-1234')).to.eql('-1,234');
    });
  });

  describe('prettyPrintArray()', function () {
    it('Single element', function () {
      expect(prettyPrintArray(['abc'])).to.eql('[abc]');
    });

    it('Multiple element', function () {
      expect(prettyPrintArray(['abc', '123', 'zyx'])).to.eql('[abc, 123, zyx]');
    });
  });

  describe('randomArrayElement()', function () {
    it('Returns random item from array', function () {
      const values = ['abc', 123];
      expect(randomArrayElement(values)).to.be.oneOf(values);
    });
  });

  describe('removeFromArray()', function () {
    it('should return an array with the matching element removed', function () {
      expect(removeFromArray(array, 'needle')).to.eql(['a', 'in', 'a', 'large', 'haystack']);
    });

    it('should return an array with multiple removed values', function () {
      expect(removeFromArray(array, ['a', 'needle', 'in'])).to.eql(['large', 'haystack']);
    });

    it('should return an array with the same values if no match is found', function () {
      expect(removeFromArray(array, 'pin')).to.eql(array);
    });
  });

  describe('secondsToHMS()', function () {
    it('Convert seconds to HH:MM:SS.mmm', function () {
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

  describe('sortObjectKeys()', function () {
    const object = { c: 3, b: 2, a: 1, _z: 0 };
    it('Sorts object keys ignoring underscore-prefixed keys', function () {
      expect(Object.keys(object)).to.eql(['c', 'b', 'a', '_z']);
      expect(Object.keys(sortObjectKeys(object, true))).to.eql(['a', 'b', 'c']);
    });

    it('Sorts object keys including underscore-prefixed keys', function () {
      expect(Object.keys(sortObjectKeys(object, false))).to.eql(['_z', 'a', 'b', 'c']);
    });
  });

  describe('stringArray()', function () {
    it('Ensures array when passed a string', function () {
      expect(stringArray('abc')).to.eql(['abc']);
    });

    it('Returns provided array', function () {
      expect(stringArray(['abc', 'def'])).to.eql(['abc', 'def']);
    });
  });

  describe('timeForFileName()', function () {
    it('Returns time string', function () {
      expect(timeForFileName()).to.match(/\d{4}-\d{2}-\d{2}_\d{6}/);
    });
  });

  describe('truncateString()', function () {
    it('Does not truncate short string', function () {
      expect(truncateString('short', 10)).to.eql('short');
    });

    it('truncates long string', function () {
      expect(truncateString('this is a long string', 14)).to.eql('this is a l...');
    });

    it('truncates long string with elipses', function () {
      expect(truncateString('this is a long string', 10, true)).to.eql('this is...');
    });

    it('truncates long string with elipses and count elipses', function () {
      expect(truncateString('this is a long string', 20, true)).to.eql('this is a long st...');
    });

    it('truncates long string with elipses and not count elipses', function () {
      expect(truncateString('this is a long string', 20, true, false)).to.eql('this is a long strin...');
    });

    it('truncates long string without elipses', function () {
      expect(truncateString('this is a long string', 10, false)).to.eql('this is a');
    });
  });

  describe('upperCaseFirst()', function () {
    it('Returns string with first character uppercased', function () {
      expect(upperCaseFirst('abc', false)).to.eql('Abc');
    });

    it('Returns string with first character uppercased and the rest lowercased', function () {
      expect(upperCaseFirst('aBC', true)).to.eql('Abc');
    });

    it('Returns string with first character uppercased and the rest lowercased', function () {
      expect(upperCaseFirst('hello WORLD', true)).to.eql('Hello world');
    });

    it('Returns string with first character uppercased leaving the rest alone', function () {
      expect(upperCaseFirst('hello WORLD', false)).to.eql('Hello WORLD');
    });
  });
});
