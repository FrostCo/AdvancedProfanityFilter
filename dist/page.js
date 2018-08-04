export default class Page {
    static isForbiddenNode(node) {
        return Boolean(node.isContentEditable || // DraftJS and many others
            (node.parentNode &&
                (node.parentNode.isContentEditable || // Special case for Gmail
                    node.parentNode.tagName == 'SCRIPT' ||
                    node.parentNode.tagName == 'STYLE' ||
                    node.parentNode.tagName == 'INPUT' ||
                    node.parentNode.tagName == 'TEXTAREA' ||
                    node.parentNode.tagName == 'IFRAME')) || // Some catch-alls
            (node.tagName &&
                (node.tagName == 'SCRIPT' ||
                    node.tagName == 'STYLE' ||
                    node.tagName == 'INPUT' ||
                    node.tagName == 'TEXTAREA' ||
                    node.tagName == 'IFRAME')));
    }
}
// Returns true if a node should *not* be altered in any way
// Credit: https://github.com/ericwbailey/millennials-to-snake-people/blob/master/Source/content_script.js
Page.whitespaceRegExp = new RegExp('\\s');
Page.xpathDocText = '//*[not(self::script or self::style)]/text()[normalize-space(.) != \"\"]';
Page.xpathNodeText = './/*[not(self::script or self::style)]/text()[normalize-space(.) != \"\"]';
