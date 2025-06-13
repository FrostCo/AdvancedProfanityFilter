export default class Page {
  xpathDocText: string;
  xpathNodeText: string;

  static readonly disabledChromePages = ['chrome.google.com', 'chromewebstore.google.com'];
  static readonly disabledFirefoxPages = ['addons.mozilla.org'];
  static readonly disabledProtocols = /^(chrome:|about:|[a-z][a-z0-9\-]*-extension:)/;
  static readonly forbiddenNodeRegExp = /^\s*(<[a-z].+?\/?>|{.+?:.+?;.*}|https?:\/\/[^\s]+$)/;
  static readonly forbiddenTags = ['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'IFRAME', 'LINK'];

  // Returns true if a node should *not* be altered in any way
  static isForbiddenNode(node: any): boolean {
    if (node.isContentEditable) {
      return true;
    }

    // Check if parentNode is a forbidden tag
    if (
      node.parentNode &&
      (node.parentNode.isContentEditable || Page.forbiddenTags.includes(node.parentNode.nodeName))
    ) {
      return true;
    }

    // Check if node is a forbidden tag
    return Page.forbiddenTags.includes(node.nodeName);
  }
}
