/* eslint "@typescript-eslint/naming-convention": [2, { selector: "objectLiteralProperty", format: ["UPPER_CASE"] }] */
import { upperCaseFirst } from './helper';

export default class Constants {
  // Named Constants
  static readonly ALL_WORDS_WORDLIST_ID = 0;
  static readonly BUILD_TARGET_BOOKMARKLET = 'bookmarklet';
  static readonly BUILD_TARGET_CHROME = 'chrome';
  static readonly BUILD_TARGET_FIREFOX = 'firefox';
  static readonly DOMAIN_MODES = { NORMAL: 0, ADVANCED: 1, DEEP: 2 };
  static readonly FALSE = 0;
  static readonly FILTER_METHODS = { CENSOR: 0, SUBSTITUTE: 1, REMOVE: 2, OFF: 3 };
  static readonly LOGGING_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  static readonly MATCH_METHODS = { EXACT: 0, PARTIAL: 1, WHOLE: 2, REGEX: 3 };
  static readonly MESSAGING = { BACKGROUND: 'background', CONTEXT: 'context', OPTION: 'option', POPUP: 'popup' };
  static readonly SELECTOR_SHADOWROOT_DELIMITER = '>>>';
  static readonly STATS_TYPE_TEXT = 'text';
  static readonly STATUS = { DISABLED: 0, NORMAL: 1, ADVANCED: 2, DEEP: 3 };
  static readonly TAB_DISABLE_ONCE = { NOT_SET: 0, DISABLED: 1, WILL_DISABLE: 2 };
  static readonly TOP_WINDOW_FRAME_ID = 0;
  static readonly TRUE = 1;

  // Helper Functions
  static filterMethodName(id: number) {
    return this.nameById(this.FILTER_METHODS, id);
  }
  static loggingLevelName(id: number) {
    return this.nameByValue(this.LOGGING_LEVELS, id);
  }
  static matchMethodName(id: number) {
    return this.nameById(this.MATCH_METHODS, id);
  }
  static nameById(obj: Record<string, number>, id: number): string {
    return upperCaseFirst(Object.entries(obj).filter((arr) => arr[1] === id)[0][0]);
  }
  static nameByValue(obj: Record<string, number>, id: number): string {
    return Object.keys(obj).find((key) => obj[key] == id);
  }

  static orderedArray(obj: Record<string, number>) {
    const result = [];
    Object.values(obj)
      .sort()
      .forEach((id) => {
        result.push(Constants.nameById(obj, id));
      });
    return result;
  }
}
