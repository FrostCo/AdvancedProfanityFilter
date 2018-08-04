export default class Word {
    static allLowerCase(string) {
        return string.toLowerCase() === string;
    }
    static allUpperCase(string) {
        return string.toUpperCase() === string;
    }
    // Word must match exactly (not sub-string)
    // /\b(w)ord\b/gi
    static buildExactRegexp(word) {
        return new RegExp('\\b(' + Word.escapeRegExp(word[0]) + ')' + Word.processRestOfWord(word.slice(1)) + '\\b', 'gi');
    }
    // Match any part of a word (sub-string)
    // /(w)ord/gi
    static buildPartRegexp(word) {
        return new RegExp('(' + Word.escapeRegExp(word[0]) + ')' + Word.processRestOfWord(word.slice(1)), 'gi');
    }
    // Match entire word that contains sub-string and surrounding whitespace
    // /\s?\b(w)ord\b\s?/gi
    static buildRegexpForRemoveExact(word) {
        return new RegExp('\\s?\\b(' + Word.escapeRegExp(word[0]) + ')' + Word.processRestOfWord(word.slice(1)) + '\\b\\s?', 'gi');
    }
    // Match entire word that contains sub-string and surrounding whitespace
    // /\s?\b[\w-]*(w)ord[\w-]*\b\s?/gi
    static buildRegexpForRemovePart(word) {
        return new RegExp('\\s?\\b([\\w-]*' + Word.escapeRegExp(word[0]) + ')' + Word.processRestOfWord(word.slice(1)) + '[\\w-]*\\b\\s?', 'gi');
    }
    // Match entire word that contains sub-string
    // /\b[\w-]*(w)ord[\w-]*\b/gi
    static buildWholeRegexp(word) {
        return new RegExp('\\b([\\w-]*' + Word.escapeRegExp(word[0]) + ')' + Word.processRestOfWord(word.slice(1)) + '[\\w-]*\\b', 'gi');
    }
    static capitalize(string) {
        return string.charAt(0).toUpperCase() + string.substr(1);
    }
    static capitalized(string) {
        return string.charAt(0).toUpperCase() === string.charAt(0);
    }
    static escapeRegExp(str) {
        return str.replace(Word._escapeRegExp, '\\$&');
    }
    // Process the rest of the word (word excluding first character)
    // This will escape the word and optionally include repeating characters
    static processRestOfWord(str) {
        var escaped = Word.escapeRegExp(str);
        if (filter && filter.cfg.matchRepeated) {
            return Word.repeatingCharacterRegexp(escaped);
        }
        return escaped;
    }
    static randomElement(array, defaults) {
        if (array.length === 0) {
            array = defaults;
        }
        return array[Math.floor((Math.random() * array.length))];
    }
    // Regexp to match repeating characters
    // Note: Skip first letter of word (used for preserveFirst)
    // Word: /(w)+o+r+d+/gi
    static repeatingCharacterRegexp(str) {
        if (str.includes('\\')) {
            var repeat = '+';
            for (var i = 0; i < str.length; i++) {
                if (str[i] === '\\') {
                    repeat += (str[i] + str[i + 1] + '+');
                    i++;
                }
                else {
                    repeat += str[i] + '+';
                }
            }
            return repeat;
        }
        else {
            return '+' + str.split('').map(letter => letter + '+').join('');
        }
    }
}
// /[-\/\\^$*+?.()|[\]{}]/g
// /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g
Word._escapeRegExp = /[-\/\\^$*+?.()|[\]{}]/g;
