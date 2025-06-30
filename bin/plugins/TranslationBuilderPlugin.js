/* eslint-disable no-console */
import TranslationBuilder from '../lib/TranslationBuilder.js';

export class TranslationBuilderPlugin {
  apply(compiler) {
    compiler.hooks.beforeCompile.tap('TranslationBuilderPlugin', () => {
      const translationBuilder = new TranslationBuilder();
      try {
        translationBuilder.run();
        console.log(translationBuilder.successMessage('TranslationBuilderPlugin'));
      } catch (error) {
        console.error(translationBuilder.errorMessage('TranslationBuilderPlugin'), error);
      }
    });
  }
}
