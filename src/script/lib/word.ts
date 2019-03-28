export default class Word {
  private static readonly _edgePunctuationRegExp = /(^[,.'"!?%$]|[,.'"!?%$]$)/;
  private static readonly _escapeRegExp = /[\/\\^$*+?.()|[\]{}]/g;
  private static readonly _unicodeRegex = /[^\u0000-\u00ff]/;
  private static readonly _unicodeWordBoundary = '[\\s.,\'"+!?|-]';
  static readonly nonWordRegExp = new RegExp('^\\s*[^\\w]+\\s*$', 'g');
  static readonly whitespaceRegExp = /^\s+$/;

  static allLowerCase(string: string): boolean {
    return string.toLowerCase() === string;
  }

  static allUpperCase(string: string): boolean {
    return string.toUpperCase() === string;
  }

  // Word must match exactly (not sub-string)
  // /\bword\b/gi
  static buildExactRegexp(str: string, matchRepeated: boolean = false): RegExp {
    try {
      if (Word.containsDoubleByte(str)) {
        // Work around for lack of word boundary support for unicode characters
        // /(^|[\s.,'"+!?|-]+)(word)([\s.,'"+!?|-]+|$)/giu
        return new RegExp('(^|' + Word._unicodeWordBoundary + '+)(' + Word.processPhrase(str, matchRepeated) + ')(' + Word._unicodeWordBoundary + '+|$)', 'giu');
      } else if (str.match(Word._edgePunctuationRegExp)) { // Begin or end with punctuation (not \w))
        return new RegExp('(^|\\s)(' + Word.processPhrase(str, matchRepeated) + ')(\\s|$)', 'giu');
      } else {
        return new RegExp('\\b' + Word.processPhrase(str, matchRepeated) + '\\b', 'gi');
      }
    } catch(e) {
      throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
    }
  }

  // Match any part of a word (sub-string)
  // /word/gi
  static buildPartRegexp(str: string, matchRepeated: boolean = false): RegExp {
    try {
      return new RegExp(Word.processPhrase(str, matchRepeated), 'gi');
    } catch(e) {
      throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
    }
  }

  // Match entire word that contains sub-string and surrounding whitespace
  // /\s?\bword\b\s?/gi
  static buildRegexpForRemoveExact(str: string, matchRepeated: boolean = false): RegExp {
    try {
      if (Word.containsDoubleByte(str)) {
        // Work around for lack of word boundary support for unicode characters
        // /(^|[\s.,'"+!?|-]+)(word)([\s.,'"+!?|-]+|$)/giu
        return new RegExp('(^|' + Word._unicodeWordBoundary + ')(' + Word.processPhrase(str, matchRepeated) + ')(' + Word._unicodeWordBoundary + '|$)', 'giu');
      } else {
        return new RegExp('\\s?\\b' + Word.processPhrase(str, matchRepeated) + '\\b\\s?', 'gi');
      }
    } catch(e) {
      throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
    }
  }

  // Match entire word that contains sub-string and surrounding whitespace
  // /\s?\b[\w-]*word[\w-]*\b\s?/gi
  static buildRegexpForRemovePart(str: string, matchRepeated: boolean = false): RegExp {
    try {
      if (Word.containsDoubleByte(str)) {
        // Work around for lack of word boundary support for unicode characters
        // /(^|[\s.,'"+!?|-]?)[\w-]*(word)[\w-]*([\s.,'"+!?|-]?|$)/giu
        return new RegExp('(^|' + Word._unicodeWordBoundary + '?)([\\w-]*' + Word.processPhrase(str, matchRepeated) + '[\\w-]*)(' + Word._unicodeWordBoundary + '?|$)', 'giu');
      } else {
        return new RegExp('\\s?\\b[\\w-]*' + Word.processPhrase(str, matchRepeated) + '[\\w-]*\\b\\s?', 'gi');
      }
    } catch(e) {
      throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
    }
  }

  // Match entire word that contains sub-string
  // /\b[\w-]*word[\w-]*\b/gi
  static buildWholeRegexp(str: string, matchRepeated: boolean = false): RegExp {
    try {
      if (Word.containsDoubleByte(str)) {
        // Work around for lack of word boundary support for unicode characters
        // (^|[\s.,'"+!?|-]*)([\S]*куче[\S]*)([\s.,'"+!?|-]*|$)/giu
        return new RegExp('(^|' + Word._unicodeWordBoundary + '*)([\\S]*' + Word.processPhrase(str, matchRepeated) + '[\\S]*)(' + Word._unicodeWordBoundary + '*|$)', 'giu');
      } else {
        return new RegExp('\\b[\\w-]*' + Word.processPhrase(str, matchRepeated) + '[\\w-]*\\b', 'gi');
      }
    } catch(e) {
      throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
    }
  }

  static capitalize(string: string): string {
    return string.charAt(0).toUpperCase() + string.substr(1);
  }

  static capitalized(string: string): boolean {
    return string.charAt(0).toUpperCase() === string.charAt(0);
  }

  static containsDoubleByte(str): boolean {
    if (!str.length) return false;
    if (str.charCodeAt(0) > 127) return true;
    return Word._unicodeRegex.test(str);
  }

  // /[-\/\\^$*+?.()|[\]{}]/g
  // /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g
  // Removing '-' for '/пресс-релиз/, giu'
  static escapeRegExp(str: string): string {
    return str.replace(Word._escapeRegExp, '\\$&');
  }

  // Process the rest of the word (word excluding first character)
  // This will escape the word and optionally include repeating characters
  static processPhrase(str: string, matchRepeated: boolean): string {
    var escaped = Word.escapeRegExp(str);
    if (matchRepeated) {
      return Word.repeatingCharacterRegexp(escaped);
    }

    return escaped;
  }

  // Regexp to match repeating characters
  // Word: /w+o+r+d+/gi
  static repeatingCharacterRegexp(str: string): string {
    if (str.includes('\\')) {
      var repeat = '';
      for (var i= 0; i < str.length; i++) {
        if (str[i] === '\\') {
          repeat += (str[i] + str[i + 1] + '+');
          i++;
        } else {
          repeat += str[i] + '+';
        }
      }
      return repeat;
    } else {
      return str.split('').map(letter => letter + '+').join('');
    }
  }
}