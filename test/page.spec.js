import { expect } from 'chai';
import Page from './built/page';

describe('Page', function() {
  describe('isForbiddenNode()', function() {
    it('should return true when node is editable', function() {
      expect(Page.isForbiddenNode({ isContentEditable: true })).to.equal(true);
      expect(Page.isForbiddenNode({ parentNode: { isContentEditable: true } })).to.equal(true);
    });

    it('should return false when node is not editable', function() {
      expect(Page.isForbiddenNode({ isContentEditable: false })).to.equal(false);
      expect(Page.isForbiddenNode({ parentNode: { isContentEditable: false } })).to.equal(false);
    });

    it('should return true when node has a parent node and tag is forbidden', function() {
      expect(Page.isForbiddenNode({ parentNode: { nodeName: 'SCRIPT' } })).to.equal(true);
      expect(Page.isForbiddenNode({ parentNode: { nodeName: 'STYLE' } })).to.equal(true);
      expect(Page.isForbiddenNode({ parentNode: { nodeName: 'INPUT' } })).to.equal(true);
      expect(Page.isForbiddenNode({ parentNode: { nodeName: 'TEXTAREA' } })).to.equal(true);
      expect(Page.isForbiddenNode({ parentNode: { nodeName: 'IFRAME' } })).to.equal(true);
    });

    it('should return true when node is a forbidden tag', function() {
      expect(Page.isForbiddenNode({ nodeName: 'SCRIPT' })).to.equal(true);
    });

    it('should return false when node is not a forbidden tag', function() {
      expect(Page.isForbiddenNode({ nodeName: 'HTML' })).to.equal(false);
    });
  });
});