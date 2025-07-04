import i18next, { i18n } from 'i18next';
import translations from '@APF/translations.js';
import { stringArray } from '@APF/lib/helper';

export default class Translation {
  i18next: i18n;

  //#region Class reference helpers
  // Can be overridden in children classes
  get Class() {
    return this.constructor as typeof Translation;
  }
  //#endregion

  constructor(namespaces: string | string[] = [], language: string = 'en') {
    namespaces = stringArray(namespaces);
    this.i18next = i18next;
    i18next.init({
      lng: language,
      fallbackLng: 'en',
      ns: namespaces,
      resources: translations,
    });
  }

  async changeLanguage(language: string) {
    return await i18next.changeLanguage(language);
  }

  t(key: string, options = {}): string {
    return i18next.t(key, options);
  }
}
