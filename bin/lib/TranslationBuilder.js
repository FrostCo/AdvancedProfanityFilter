import fs from 'fs';
import path from 'path';

export default class TranslationBuilder {
  constructor() {
    this.localesDir = path.join('locales');
    this.translations = {};
  }

  bookmarklet() {
    // Bookmarklet build does not require translations
    this.translations = { en: {} };
  }

  build() {
    this.translations = this.combineLocaleFiles(this.localesDir);
  }

  get combinedTranslationsPath() {
    return path.join('src', 'script', 'translations.js');
  }

  combineLocaleFiles(root) {
    const combined = {};

    // Iterate through each language directory (e.g., 'en', 'fr')
    fs.readdirSync(root).forEach((locale) => {
      combined[locale] = {};
      const localeDir = path.join(root, locale);

      // Iterate through each namespace file in the language directory
      fs.readdirSync(localeDir).forEach((file) => {
        const namespace = path.basename(file, '.json');
        const filePath = path.join(localeDir, file);
        const fileContents = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Assign the namespace contents to the appropriate language
        combined[locale][namespace] = fileContents;
      });
    });

    return combined;
  }

  errorMessage(label = 'TranslationBuilder') {
    return `❌ [${label}] Failed to build translations`;
  }

  get output() {
    return `export const translations = ${JSON.stringify(this.translations, null, 2)};\n\nexport default translations;\n`;
  }

  run() {
    this.build();
    this.writeTranslations();
  }

  successMessage(label = 'TranslationBuilder') {
    return `🌐 [${label}] Translations built`;
  }

  writeTranslations() {
    fs.writeFileSync(this.combinedTranslationsPath, this.output, 'utf8');
  }
}
