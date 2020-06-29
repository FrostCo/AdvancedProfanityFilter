const expect = require('chai').expect;
import { escapeHTML, formatNumber, getVersion, isVersionOlder, removeFromArray } from '../built/lib/helper';

const array = ['a', 'needle', 'in', 'a', 'large', 'haystack'];

describe('Helper', function() {
  describe('escapeHTML()', function() {
    it('should return HTML safe string', function() {
      expect(escapeHTML('a>b')).to.eql('a&gt;b');
      expect(escapeHTML('(?<!un)censored')).to.eql('(?&lt;!un)censored');
      expect(escapeHTML('already safe')).to.eql('already safe');
    });
  });

  describe('formatNumber()', function() {
    it('Format numbers for counter display', function() {
      expect(formatNumber(999)).to.eql('999');
      expect(formatNumber(1000)).to.eql('1k');
      expect(formatNumber(1499)).to.eql('1.5k');
      expect(formatNumber(1500)).to.eql('1.5k');
      expect(formatNumber(9999)).to.eql('10k');
      expect(formatNumber(10000)).to.eql('10k');
      expect(formatNumber(500000)).to.eql('500k');
      expect(formatNumber(999499)).to.eql('999k');
      expect(formatNumber(999500)).to.eql('1M');
      expect(formatNumber(1200000)).to.eql('1.2M');
      expect(formatNumber(994999999)).to.eql('990M');
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

  describe('removeFromArray()', function() {
    it('should return an array with the matching element removed', function() {
      expect(removeFromArray(array, 'needle')).to.eql(['a', 'in', 'a', 'large', 'haystack']);
    });

    it('should return an array with the same values if no match is found', function() {
      expect(removeFromArray(array, 'pin')).to.eql(array);
    });
  });
});