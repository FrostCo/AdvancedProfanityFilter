/* eslint-disable no-console */
import TranslationBuilder from '../lib/TranslationBuilder.js';

export class BookmarkletTranslationBuilderPlugin {
  apply(compiler) {
    compiler.hooks.beforeCompile.tap('BookmarkletTranslationBuilderPlugin', () => {
      const translationBuilder = new TranslationBuilder();
      translationBuilder.bookmarklet();
      try {
        translationBuilder.writeTranslations();
        console.log(translationBuilder.bookmarkletSuccessMessage('BookmarkletTranslationBuilderPlugin'));
      } catch (error) {
        console.error(translationBuilder.errorMessage('BookmarkletTranslationBuilderPlugin'), error);
      }
    });
  }
}
