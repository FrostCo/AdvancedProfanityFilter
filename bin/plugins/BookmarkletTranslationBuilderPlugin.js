import TranslationBuilder from '../lib/TranslationBuilder.js';

export class BookmarkletTranslationBuilderPlugin {
  apply(compiler) {
    compiler.hooks.beforeCompile.tap('BookmarkletTranslationBuilderPlugin', () => {
      const translationBuilder = new TranslationBuilder();
      translationBuilder.bookmarklet();
      translationBuilder.writeTranslations();
    });
  }
}
