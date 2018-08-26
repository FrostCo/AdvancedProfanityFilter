export default class Word {
    static allLowerCase(string) {
        return string.toLowerCase() === string;
    }
    static allUpperCase(string) {
        return string.toUpperCase() === string;
    }
    // Word must match exactly (not sub-string)
    // /\bword\b/gi
    static buildExactRegexp(str, matchRepeated = false) {
        try {
            if (Word.containsDoubleByte(str)) {
                // Work around for lack of word boundary support for unicode characters
                // /(^|[\s.,'"+!?|-]+)(word)([\s.,'"+!?|-]+|$)/giu
                return new RegExp('(^|' + Word._unicodeWordBoundary + '+)(' + Word.processPhrase(str, matchRepeated) + ')(' + Word._unicodeWordBoundary + '+|$)', 'giu');
            }
            else {
                return new RegExp('\\b' + Word.processPhrase(str, matchRepeated) + '\\b', 'gi');
            }
        }
        catch (e) {
            throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
        }
    }
    // Match any part of a word (sub-string)
    // /word/gi
    static buildPartRegexp(str, matchRepeated = false) {
        try {
            return new RegExp(Word.processPhrase(str, matchRepeated), 'gi');
        }
        catch (e) {
            throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
        }
    }
    // Match entire word that contains sub-string and surrounding whitespace
    // /\s?\bword\b\s?/gi
    static buildRegexpForRemoveExact(str, matchRepeated = false) {
        try {
            if (Word.containsDoubleByte(str)) {
                // Work around for lack of word boundary support for unicode characters
                // /(^|[\s.,'"+!?|-]+)(word)([\s.,'"+!?|-]+|$)/giu
                return new RegExp('(^|' + Word._unicodeWordBoundary + ')(' + Word.processPhrase(str, matchRepeated) + ')(' + Word._unicodeWordBoundary + '|$)', 'giu');
            }
            else {
                return new RegExp('\\s?\\b' + Word.processPhrase(str, matchRepeated) + '\\b\\s?', 'gi');
            }
        }
        catch (e) {
            throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
        }
    }
    // Match entire word that contains sub-string and surrounding whitespace
    // /\s?\b[\w-]*word[\w-]*\b\s?/gi
    static buildRegexpForRemovePart(str, matchRepeated = false) {
        try {
            if (Word.containsDoubleByte(str)) {
                // Work around for lack of word boundary support for unicode characters
                // /(^|[\s.,'"+!?|-]?)[\w-]*(word)[\w-]*([\s.,'"+!?|-]?|$)/giu
                return new RegExp('(^|' + Word._unicodeWordBoundary + '?)([\\w-]*' + Word.processPhrase(str, matchRepeated) + '[\\w-]*)(' + Word._unicodeWordBoundary + '?|$)', 'giu');
            }
            else {
                return new RegExp('\\s?\\b[\\w-]*' + Word.processPhrase(str, matchRepeated) + '[\\w-]*\\b\\s?', 'gi');
            }
        }
        catch (e) {
            throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
        }
    }
    // Match entire word that contains sub-string
    // /\b[\w-]*word[\w-]*\b/gi
    static buildWholeRegexp(str, matchRepeated = false) {
        try {
            if (Word.containsDoubleByte(str)) {
                // Work around for lack of word boundary support for unicode characters
                // (^|[\s.,'"+!?|-]*)([\w-]*куче[\w-]*)([\s.,'"+!?|-]*|$)/giu
                return new RegExp('(^|' + Word._unicodeWordBoundary + '+)([\\w-]*' + Word.processPhrase(str, matchRepeated) + '[\\w-]*)(' + Word._unicodeWordBoundary + '+|$)', 'giu');
            }
            else {
                return new RegExp('\\b[\\w-]*' + Word.processPhrase(str, matchRepeated) + '[\\w-]*\\b', 'gi');
            }
        }
        catch (e) {
            throw new Error('Failed to create RegExp for "' + str + '" - ' + e.name + ' ' + e.message);
        }
    }
    static capitalize(string) {
        return string.charAt(0).toUpperCase() + string.substr(1);
    }
    static capitalized(string) {
        return string.charAt(0).toUpperCase() === string.charAt(0);
    }
    static containsDoubleByte(str) {
        if (!str.length)
            return false;
        if (str.charCodeAt(0) > 255)
            return true;
        return Word._unicodeRegex.test(str);
    }
    // /[-\/\\^$*+?.()|[\]{}]/g
    // /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g
    static escapeRegExp(str) {
        return str.replace(Word._escapeRegExp, '\\$&');
    }
    // Process the rest of the word (word excluding first character)
    // This will escape the word and optionally include repeating characters
    static processPhrase(str, matchRepeated) {
        var escaped = Word.escapeRegExp(str);
        if (matchRepeated) {
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
    // Word: /w+o+r+d+/gi
    static repeatingCharacterRegexp(str) {
        if (str.includes('\\')) {
            var repeat = '';
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
            return str.split('').map(letter => letter + '+').join('');
        }
    }
}
Word._escapeRegExp = /[-\/\\^$*+?.()|[\]{}]/g;
Word._unicodeRegex = /[^\u0000-\u00ff]/;
Word._unicodeWordBoundary = '[\\s.,\'"+!?|-]';
Word.nonWordRegExp = new RegExp('^\\s*[^\\w]\\s*$', 'g');
Word.whitespaceRegExp = new RegExp('^\\s*$');
