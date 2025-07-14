/* eslint-disable no-console */
import TranslationBuilder from '../lib/TranslationBuilder.js';

const translationBuilder = new TranslationBuilder();
try {
  translationBuilder.run();
  console.log(translationBuilder.successMessage('build-translations'));
} catch (error) {
  console.error(translationBuilder.errorMessage('build-translations'), error);
}
