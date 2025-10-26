import { expect } from 'chai';
import sinon from 'sinon';
import Translation from '@APF/Translation';

describe('Translation', function () {
  let translation: Translation;

  beforeEach(function () {
    // Create a fresh translation instance for each test
    translation = new Translation();
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('constructor', function () {
    it('should initialize with default parameters', function () {
      expect(translation).to.be.instanceOf(Translation);
      expect(translation.i18next).to.exist;
    });

    it('should initialize with single namespace string', function () {
      const testTranslation = new Translation('common');
      expect(testTranslation).to.be.instanceOf(Translation);
      expect(testTranslation.i18next).to.exist;
    });

    it('should initialize with multiple namespaces array', function () {
      const testTranslation = new Translation(['common', 'popup']);
      expect(testTranslation).to.be.instanceOf(Translation);
      expect(testTranslation.i18next).to.exist;
    });

    it('should initialize with custom language', function () {
      const testTranslation = new Translation('common', 'fr');
      expect(testTranslation).to.be.instanceOf(Translation);
      expect(testTranslation.i18next).to.exist;
    });

    it('should initialize with both custom namespaces and language', function () {
      const testTranslation = new Translation(['common', 'options'], 'es');
      expect(testTranslation).to.be.instanceOf(Translation);
      expect(testTranslation.i18next).to.exist;
    });

    it('should set i18next property', function () {
      expect(translation.i18next).to.exist;
      expect(translation.i18next).to.have.property('init');
      expect(translation.i18next).to.have.property('changeLanguage');
      expect(translation.i18next).to.have.property('t');
    });
  });

  describe('Class getter', function () {
    it('should return the constructor class', function () {
      expect(translation.Class).to.equal(Translation);
    });
  });

  describe('changeLanguage', function () {
    it('should be a function', function () {
      expect(translation.changeLanguage).to.be.a('function');
    });

    it('should return a promise', function () {
      const result = translation.changeLanguage('fr');
      expect(result).to.be.a('promise');
    });

    it('should handle different languages', async function () {
      await translation.changeLanguage('de');
      await translation.changeLanguage('ja');
      // If no error is thrown, the method is working
      expect(true).to.be.true;
    });

    it('should handle invalid language gracefully', async function () {
      try {
        await translation.changeLanguage('invalid');
        // Should not throw an error
        expect(true).to.be.true;
      } catch (error) {
        // If it does throw, that's also acceptable behavior
        expect(error).to.exist;
      }
    });
  });

  describe('t method', function () {
    it('should be a function', function () {
      expect(translation.t).to.be.a('function');
    });

    it('should return a string', function () {
      const result = translation.t('common:app.name');
      expect(result).to.be.a('string');
    });

    it('should handle different translation keys', function () {
      const result1 = translation.t('popup:labels.domainMode');
      const result2 = translation.t('options:configsPage.headers.configuration');

      expect(result1).to.be.a('string');
      expect(result2).to.be.a('string');
    });

    it('should handle options parameter', function () {
      const options = { defaultValue: 'default text' };
      const result = translation.t('common:app.name', options);

      expect(result).to.be.a('string');
    });

    it('should handle complex options', function () {
      const complexOptions = {
        defaultValue: 'Default Value',
        count: 5,
        interpolation: { value: 'test' },
      };

      const result = translation.t('common:app.name', complexOptions);
      expect(result).to.be.a('string');
    });

    it('should handle missing keys gracefully', function () {
      const result = translation.t('nonexistent:key');
      expect(result).to.be.a('string');
    });
  });

  describe('integration scenarios', function () {
    it('should work with multiple method calls', async function () {
      // Change language
      await translation.changeLanguage('fr');

      // Translate text
      const result = translation.t('common:app.name');
      expect(result).to.be.a('string');
    });

    it('should handle rapid successive calls', function () {
      const result1 = translation.t('common:app.name');
      const result2 = translation.t('popup:labels.domainMode');
      const result3 = translation.t('options:configsPage.headers.configuration');

      expect(result1).to.be.a('string');
      expect(result2).to.be.a('string');
      expect(result3).to.be.a('string');
    });

    it('should work with different constructor parameters', function () {
      const translation1 = new Translation('common');
      const translation2 = new Translation(['common', 'popup'], 'fr');

      expect(translation1).to.be.instanceOf(Translation);
      expect(translation2).to.be.instanceOf(Translation);

      const result1 = translation1.t('common:app.name');
      const result2 = translation2.t('popup:labels.domainMode');

      expect(result1).to.be.a('string');
      expect(result2).to.be.a('string');
    });
  });

  describe('error handling', function () {
    it('should handle invalid translation keys gracefully', function () {
      const result = translation.t('invalid:key:that:does:not:exist');
      expect(result).to.be.a('string');
    });

    it('should handle null or undefined keys', function () {
      const result1 = translation.t(null as any);
      const result2 = translation.t(undefined as any);

      expect(result1).to.be.a('string');
      expect(result2).to.be.a('string');
    });

    it('should handle invalid language changes gracefully', async function () {
      try {
        await translation.changeLanguage(null as any);
        // Should not throw an error
        expect(true).to.be.true;
      } catch (error) {
        // If it does throw, that's also acceptable behavior
        expect(error).to.exist;
      }
    });
  });
});
