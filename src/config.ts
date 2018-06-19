// TODO: Local storage/sync (use local storage and store sync setting there)
class Config {
    censorCharacter: string;
    censorFixedLength: number;
    defaultSubstitutions: string[];
    disabledDomains: string[];
    filterMethod: number;
    globalMatchMethod: number;
    password: string;
    preserveFirst: boolean;
    preserveLast: boolean;
    showCounter: boolean;
    substitutionMark: boolean;
    wordList: string[];
    words: {
        [key: string]: {
            matchMethod: number;
            words: string[];
        }
    };

    private static readonly _defaults = {
        "censorCharacter": "*",
        "censorFixedLength": 0,
        "defaultSubstitutions": ["censored", "expletive", "filtered"],
        "disabledDomains": [],
        "filterMethod": 0, // ["Censor", "Substitute", "Remove"];
        "globalMatchMethod": 3, // ["Exact", "Partial", "Whole", "Per-Word", "RegExp"]
        "password": null,
        "preserveFirst": false,
        "preserveLast": false,
        "showCounter": true,
        "substitutionMark": true,
        "words": {}
    };

    private static readonly _defaultWords = {
        "ass": { "matchMethod": 0, "words": ["butt", "tail"] },
        "asses": { "matchMethod": 0, "words": ["butts"] },
        "asshole": { "matchMethod": 1, "words": ["butthole", "jerk"] },
        "bastard": { "matchMethod": 1, "words": ["imperfect", "impure"] },
        "bitch": { "matchMethod": 1, "words": ["jerk"] },
        "cunt": { "matchMethod": 1, "words": ["explative"] },
        "damn": { "matchMethod": 1, "words": ["dang", "darn"] },
        "fuck": { "matchMethod": 1, "words": ["freak", "fudge"] },
        "piss": { "matchMethod": 1, "words": ["pee"] },
        "pissed": { "matchMethod": 0, "words": ["ticked"] },
        "slut": { "matchMethod": 1, "words": ["imperfect", "impure"] },
        "shit": { "matchMethod": 1, "words": ["crap", "crud", "poop"] },
        "tits": { "matchMethod": 1, "words": ["explative"] },
        "whore": { "matchMethod": 1, "words": ["harlot", "tramp"] }
    };

    static async build() {
        let async_result = await Config.getConfig();
        let instance = await new Config(async_result);
        return instance;
    }

    // Call build() to create a new instance
    constructor(async_param) {
        if (typeof async_param === 'undefined') {
            throw new Error('Cannot be called directly. call build()');
        }
        // TODO: Not supported yet
        // Object.assign(async_param, this);
        for(var k in async_param) this[k]=async_param[k];
    }

    static getConfig() {
        return new Promise(function(resolve, reject) {
            chrome.storage.sync.get(Config._defaults, function(items) {
                // Use default words if none were provided
                if (Object.keys(items.words).length === 0 && items.words.constructor === Object) {
                    items.words = Config._defaultWords;
                }

                // TOOD: Do the work! - Words is alphabetical, wordList is longest to shortest
                // Sort the words array by longest (most-specific) first
                items.wordList = Object.keys(items.words).sort(function(a, b) {
                    return b.length - a.length;
                });
                resolve(items);
            });
        });
    }
}

// TODO: Workaround to add module support for content scripts
exportVars({ Config }).from('config');