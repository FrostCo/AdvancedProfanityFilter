/* eslint "@typescript-eslint/naming-convention": [2, { selector: "objectLiteralProperty", format: ["UPPER_CASE"] }] */
import { upperCaseFirst } from './helper';

export default class Constants {
  // Named Constants
  static readonly DOMAIN_MODES = { NORMAL: 0, ADVANCED: 1, DEEP: 2 };
  static readonly FILTER_METHODS = { CENSOR: 0, SUBSTITUTE: 1, REMOVE: 2 };
  static readonly MATCH_METHODS = { EXACT: 0, PARTIAL: 1, WHOLE: 2, REGEX: 3 };
  static readonly MUTE_METHODS = { TAB: 0, VIDEO: 1, NONE: 2 };
  static readonly SHOW_SUBTITLES = { ALL: 0, FILTERED: 1, UNFILTERED: 2, NONE: 3 };

  // Helper Functions
  static filterMethodName(id: number) { return this.nameById(this.FILTER_METHODS, id); }
  static matchMethodName(id: number) { return this.nameById(this.MATCH_METHODS, id); }
  static nameById(obj: Record<string, number>, id: number): string {
    return upperCaseFirst(Object.entries(obj).filter((arr) => arr[1] === id)[0][0]);
  }

  static orderedArray(obj: Record<string, number>) {
    const result = [];
    Object.values(obj).sort().forEach((id) => { result.push(Constants.nameById(obj, id)); });
    return result;
  }
}
