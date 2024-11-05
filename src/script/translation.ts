import i18next, { i18n } from 'i18next';
import { stringArray } from '@APF/lib/helper';

// __TRANSLATIONS__ is injected by webpack from ROOT/src/script/
/* eslint-disable-next-line @typescript-eslint/naming-convention */
declare const __TRANSLATIONS__: any;

export default class Translation {
  i18next: i18n;

  static readonly translations = typeof __TRANSLATIONS__ == 'undefined' ? { common: {} }  : __TRANSLATIONS__;

  //#region Class reference helpers
  // Can be overridden in children classes
  get Class() { return (this.constructor as typeof Translation); }
  //#endregion

  constructor(namespaces: string|string[] = [], language: string = 'en') {
    namespaces = stringArray(namespaces);
    this.i18next = i18next;
    i18next.init({
      lng: language,
      fallbackLng: 'en',
      ns: namespaces,
      resources: this.Class.translations,
    });
  }

  async changeLanguage(language: string) {
    return await i18next.changeLanguage(language);
  }

  t(key: string, options = {}): string {
    return i18next.t(key, options);
  }
}
