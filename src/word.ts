class Word {
  static allLowerCase(string: string): boolean {
    return string.toLowerCase() === string;
  }

  static allUpperCase(string: string): boolean {
    return string.toUpperCase() === string;
  }

  // Word must match exactly (not sub-string)
  // /\b(w)ord\b/gi
  static buildExactRegexp(word: string) {
    return new RegExp('\\b(' + word[0] + ')' + Word.escapeRegExp(word.slice(1)) + '\\b', 'gi' );
  }

  // Match any part of a word (sub-string)
  // /(w)ord/gi
  static buildPartRegexp(word: string) {
    return new RegExp('(' + word[0] + ')' + Word.escapeRegExp(word.slice(1)), 'gi' );
  }

  // Match entire word that contains sub-string and surrounding whitespace
  // /\s?\b(w)ord\b\s?/gi
  static buildRegexpForRemoveExact(word: string) {
    return new RegExp('\\s?\\b(' + word[0] + ')' + Word.escapeRegExp(word.slice(1)) + '\\b\\s?', 'gi' );
  }

  // Match entire word that contains sub-string and surrounding whitespace
  // /\s?\b[\w-]*(w)ord[\w-]*\b\s?/gi
  static buildRegexpForRemovePart(word: string) {
    return new RegExp('\\s?\\b([\\w-]*' + word[0] + ')' + Word.escapeRegExp(word.slice(1)) + '[\\w-]*\\b\\s?', 'gi' );
  }

  // Match entire word that contains sub-string
  // /\b[\w-]*(w)ord[\w-]*\b/gi
  static buildWholeRegexp(word: string) {
    return new RegExp('\\b([\\w-]*' + word[0] + ')' + Word.escapeRegExp(word.slice(1)) + '[\\w-]*\\b', 'gi' )
  }

  static capitalize(string: string): string {
    return string.charAt(0).toUpperCase() + string.substr(1);
  }

  static capitalized(string: string): boolean {
    return string.charAt(0).toUpperCase() === string.charAt(0);
  }

  static escapeRegExp(str: string): string {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }

  // TODO: Dependent on filter
  static randomElement(array: any[]) {
    if (array.length === 0) {
      array = filter.cfg.defaultSubstitutions;
    }
    return array[Math.floor((Math.random()*array.length))];
  }
}