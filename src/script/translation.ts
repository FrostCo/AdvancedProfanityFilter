import i18next, { i18n } from 'i18next';
import translations from '@APF/translations.js';
import { stringArray } from '@APF/lib/helper';

export default class Translation {
  i18next: i18n;

  constructor(namespaces: string|string[] = [], language: string = 'en') {
    namespaces = stringArray(namespaces);
    this.i18next = i18next;
    i18next.init({
      lng: language,
      fallbackLng: 'en',
      ns: namespaces,
      resources: translations
    });
  }

  async changeLanguage(language: string) {
    return await i18next.changeLanguage(language);
  }

  t(key) {
    return i18next.t(key);
  }
}
