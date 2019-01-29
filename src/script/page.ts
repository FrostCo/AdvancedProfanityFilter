export default class Page {
  xpathDocText: string;
  xpathNodeText: string;

  static readonly forbiddenNodeRegExp = new RegExp('^\s*(<[a-z].+?\/?>|{.+?:.+?;.*}|https?:\/\/[^\s]+$)');
  static readonly forbiddenTags = ['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'IFRAME', 'LINK'];

  static getTagFromNode(node): string {
    return node.tagName || node.nodeName;
  }

  // Returns true if a node should *not* be altered in any way
  static isForbiddenNode(node: any): boolean {
    if (node.isContentEditable) { return true; }

    // Check if parentNode is a forbidden tag
    if (node.parentNode && (
      node.parentNode.isContentEditable ||
      Page.forbiddenTags.includes(Page.getTagFromNode(node.parentNode)))
    ) { return true; }

    // Check if node is a forbidden tag
    return Page.forbiddenTags.includes(Page.getTagFromNode(node));
  }
}