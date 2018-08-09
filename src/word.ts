export default class Word {
  private static readonly _escapeRegExp = /[-\/\\^$*+?.()|[\]{}]/g;

  static allLowerCase(string: string): boolean {
    return string.toLowerCase() === string;
  }

  static allUpperCase(string: string): boolean {
    return string.toUpperCase() === string;
  }

  // Word must match exactly (not sub-string)
  // /\bword\b/gi
  static buildExactRegexp(str: string, matchRepeated: boolean = false) {
    try {
      return new RegExp('\\b' + Word.processPhrase(str, matchRepeated) + '\\b', 'gi');
    } catch(e) { console.log('Error: Failed to filter: ' + str); }
  }

  // Match any part of a word (sub-string)
  // /word/gi
  static buildPartRegexp(str: string, matchRepeated: boolean = false) {
    try {
      return new RegExp(Word.processPhrase(str, matchRepeated), 'gi');
    } catch(e) { console.log('Error: Failed to filter: ' + str); }
  }

  // Match entire word that contains sub-string and surrounding whitespace
  // /\s?\bword\b\s?/gi
  static buildRegexpForRemoveExact(str: string, matchRepeated: boolean = false) {
    try {
      return new RegExp('\\s?\\b' + Word.processPhrase(str, matchRepeated) + '\\b\\s?', 'gi');
    } catch(e) { console.log('Error: Failed to filter: ' + str); }
  }

  // Match entire word that contains sub-string and surrounding whitespace
  // /\s?\b[\w-]*word[\w-]*\b\s?/gi
  static buildRegexpForRemovePart(str: string, matchRepeated: boolean = false) {
    try {
      return new RegExp('\\s?\\b[\\w-]*' + Word.processPhrase(str, matchRepeated) + '[\\w-]*\\b\\s?', 'gi');
    } catch(e) { console.log('Error: Failed to filter: ' + str); }
  }

  // Match entire word that contains sub-string
  // /\b[\w-]*word[\w-]*\b/gi
  static buildWholeRegexp(str: string, matchRepeated: boolean = false) {
    try {
      return new RegExp('\\b([\\w-]*' + Word.processPhrase(str, matchRepeated) + '[\\w-]*\\b', 'gi');
    } catch(e) { console.log('Error: Failed to filter: ' + str); }
  }

  static capitalize(string: string): string {
    return string.charAt(0).toUpperCase() + string.substr(1);
  }

  static capitalized(string: string): boolean {
    return string.charAt(0).toUpperCase() === string.charAt(0);
  }

  // /[-\/\\^$*+?.()|[\]{}]/g
  // /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g
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

  static randomElement(array: string[], defaults: string[]) {
    if (array.length === 0) {
      array = defaults;
    }
    return array[Math.floor((Math.random()*array.length))];
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