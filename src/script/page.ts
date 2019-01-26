export default class Page {
  xpathDocText: string;
  xpathNodeText: string;

  static readonly allowedAdvancedTags = ['SCRIPT'];
  static readonly forbiddenNodeRegExp = new RegExp('^\s*(<[a-z].+?\/?>|{.+?:.+?;.*}|https?:\/\/[^\s]+$)');
  static readonly forbiddenTags = ['LINK', 'STYLE', 'INPUT', 'TEXTAREA', 'IFRAME'];
  static readonly xpathDocText = '//*[not(self::script or self::style)]/text()[normalize-space(.) != \"\"]';
  static readonly xpathNodeText = './/*[not(self::script or self::style)]/text()[normalize-space(.) != \"\"]';

  // Returns true if a node should *not* be altered in any way
  // Credit: https://github.com/ericwbailey/millennials-to-snake-people/blob/master/Source/content_script.js
  static isForbiddenNode(node: any, advanced: boolean = false): boolean {
    if (node.parentNode) { node = node.parentNode }
    if (node.isContentEditable) { return true; }
    return Page.forbiddenTag(node.tagName, advanced);
  }

  static forbiddenTag(tagName: string, advanced: boolean): boolean {
    return Boolean (
      Page.forbiddenTags.includes(tagName) ||
      (!advanced && Page.allowedAdvancedTags.includes(tagName))
    );
  }
}