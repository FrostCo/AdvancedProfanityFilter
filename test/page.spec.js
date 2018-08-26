const expect = require('chai').expect;
import Page from '../dist/page';

describe('Page', function() {
  describe('isForbiddenNode()', function() {
    it('should return true when node is editable', function() {
      let node = { isContentEditable: true };
      expect(Page.isForbiddenNode(node)).to.equal(true);
    });

    it('should return false when node is not editable', function() {
      let node = { isContentEditable: false };
      expect(Page.isForbiddenNode(node)).to.equal(false);
    });

    it('should return true when node has a parent node and tag is forbidden', function() {
      let node = { parentNode: { tagName: 'SCRIPT' } };
      expect(Page.isForbiddenNode(node)).to.equal(true);
    });

    it('should return true when node is a forbidden tag', function() {
      let node = { tagName: 'SCRIPT' };
      expect(Page.isForbiddenNode(node)).to.equal(true);
    });

    it('should return false when node is not a forbidden tag', function() {
      let node = { tagName: 'HTML' };
      expect(Page.isForbiddenNode(node)).to.equal(false);
    });
  });
});