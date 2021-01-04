export default class Constants {
  // Named Constants
  static readonly DomainModes = { Normal: 0, Advanced: 1, Deep: 2 };
  static readonly FilterMethods = { Censor: 0, Substitute: 1, Remove: 2 };
  static readonly MatchMethods = { Exact: 0, Partial: 1, Whole: 2, Regex: 3 };
  static readonly MuteMethods = { Tab: 0, Video: 1, None: 2 };
  static readonly ShowSubtitles = { All: 0, Filtered: 1, Unfiltered: 2, None: 3 };

  // Helper Functions
  static filterMethodName(id: number) { return this.nameById(this.FilterMethods, id); }
  static matchMethodName(id: number) { return this.nameById(this.MatchMethods, id); }
  static nameById(obj: object, id: number): string {
    return Object.entries(obj).filter(arr => arr[1] === id)[0][0];
  }

  static orderedArray(obj: object) {
    let result = [];
    Object.values(obj).sort().forEach(id => { result.push(Constants.nameById(obj, id)); });
    return result;
  }
}