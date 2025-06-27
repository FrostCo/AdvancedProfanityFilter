import TranslationBuilder from '../lib/TranslationBuilder.js';

export class TranslationBuilderPlugin {
  apply(compiler) {
    compiler.hooks.beforeCompile.tap('TranslationBuilderPlugin', () => {
      const translationBuilder = new TranslationBuilder();
      translationBuilder.run();
      console.log('[i18n] Translations built successfully.');
    });
  }
}
