/* eslint "@typescript-eslint/naming-convention": [2, { selector: "objectLiteralProperty", format: ["UPPER_CASE"] }] */
import { upperCaseFirst } from './helper';

export default class Constants {
  // Named Constants
  static readonly ALL_WORDS_WORDLIST_ID = 0;
  static readonly BUILD_TARGET_BOOKMARKLET = 'bookmarklet';
  static readonly BUILD_TARGET_CHROME = 'chrome';
  static readonly BUILD_TARGET_FIREFOX = 'firefox';
  static readonly BUILD_TARGET_IOS = 'ios';
  static readonly BUILD_TARGET_SAFARI = 'safari';
  static readonly DOMAIN_MODES = { NORMAL: 0, ADVANCED: 1, DEEP: 2 };
  static readonly FALSE = 0;
  static readonly FILTER_METHODS = { CENSOR: 0, SUBSTITUTE: 1, REMOVE: 2, OFF: 3 };
  static readonly LOGGING_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  static readonly MATCH_METHODS = { EXACT: 0, PARTIAL: 1, WHOLE: 2, REGEX: 3 };
  static readonly MUTE_METHODS = { TAB: 0, VIDEO_VOLUME: 1, VIDEO_MUTE: 2, NONE: 9 };
  static readonly SHOW_SUBTITLES = { ALL: 0, FILTERED: 1, UNFILTERED: 2, NONE: 3 };
  static readonly STATS_TYPE_AUDIO = 'audio';
  static readonly STATS_TYPE_TEXT = 'text';
  static readonly TRUE = 1;

  // Helper Functions
  static filterMethodName(id: number) { return this.nameById(this.FILTER_METHODS, id); }
  static loggingLevelName(id: number) { return this.nameByValue(this.LOGGING_LEVELS, id); }
  static matchMethodName(id: number) { return this.nameById(this.MATCH_METHODS, id); }
  static nameById(obj: Record<string, number>, id: number): string {
    return upperCaseFirst(Object.entries(obj).filter((arr) => arr[1] === id)[0][0]);
  }
  static nameByValue(obj: Record<string, number>, id: number): string {
    return Object.keys(obj).find((key) => obj[key] == id);
  }

  static orderedArray(obj: Record<string, number>) {
    const result = [];
    Object.values(obj).sort().forEach((id) => { result.push(Constants.nameById(obj, id)); });
    return result;
  }
}
