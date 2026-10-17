/* eslint-disable @typescript-eslint/naming-convention */
import { expect } from 'chai';
import { Config, Constants, Filter, Logger, Word, Wordlist } from '@APF/lib';
import ConfigSource from '@APF/lib/Config';
import ConstantsSource from '@APF/lib/Constants';
import FilterSource from '@APF/lib/Filter';
import LoggerSource from '@APF/lib/Logger';
import WordSource from '@APF/lib/Word';
import WordlistSource from '@APF/lib/Wordlist';

// Shape of a filtered subset of an extension options export. Underscore-prefixed
// storage keys are removed by WebConfig.ordered() before the file is written.
const exportedConfig = {
  censorCharacter: '*',
  censorFixedLength: 0,
  defaultSubstitution: 'censored',
  defaultWordMatchMethod: Constants.MATCH_METHODS.EXACT,
  defaultWordRepeat: Constants.FALSE,
  defaultWordSeparators: Constants.FALSE,
  domains: { 'example.com': { disabled: false } },
  filterMethod: Constants.FILTER_METHODS.SUBSTITUTE,
  filterWordList: true,
  iWordAllowlist: ['okphrase'],
  language: 'en',
  preserveCase: true,
  preserveFirst: true,
  preserveLast: false,
  substitutionMark: false,
  wordAllowlist: ['Class'],
  wordlistId: 0,
  wordlists: ['Default', 'Work'],
  wordlistsEnabled: true,
  words: {
    'A+': {
      lists: [],
      matchMethod: Constants.MATCH_METHODS.EXACT,
      repeat: Constants.FALSE,
      separators: Constants.FALSE,
      sub: 'top',
    },
    bad: {
      lists: [],
      matchMethod: Constants.MATCH_METHODS.EXACT,
      repeat: Constants.TRUE,
      separators: Constants.FALSE,
      sub: 'good',
    },
    blank: {
      lists: [],
      matchMethod: Constants.MATCH_METHODS.EXACT,
      repeat: Constants.FALSE,
      separators: Constants.FALSE,
      sub: '',
    },
    class: {
      lists: [],
      matchMethod: Constants.MATCH_METHODS.EXACT,
      repeat: Constants.FALSE,
      separators: Constants.FALSE,
      sub: 'group',
    },
    okphrase: {
      lists: [],
      matchMethod: Constants.MATCH_METHODS.EXACT,
      repeat: Constants.FALSE,
      separators: Constants.FALSE,
      sub: 'nope',
    },
    sample: {
      lists: [1],
      matchMethod: Constants.MATCH_METHODS.PARTIAL,
      repeat: Constants.FALSE,
      separators: Constants.FALSE,
      sub: 'piece',
    },
    врата: {
      lists: [],
      matchMethod: Constants.MATCH_METHODS.EXACT,
      repeat: Constants.FALSE,
      separators: Constants.FALSE,
      sub: 'door',
    },
  },
  wordSubSeparator: ';;',
};

function configFromExport() {
  return new Config(JSON.parse(JSON.stringify(exportedConfig)));
}

function filterFromExport() {
  const filter = new Filter();
  filter.cfg = configFromExport();
  filter.init();
  return filter;
}

describe('Core package', function () {
  describe('public entry', function () {
    it('re-exports the filtering classes from their source modules', function () {
      expect(Config).to.equal(ConfigSource);
      expect(Constants).to.equal(ConstantsSource);
      expect(Filter).to.equal(FilterSource);
      expect(Logger).to.equal(LoggerSource);
      expect(Word).to.equal(WordSource);
      expect(Wordlist).to.equal(WordlistSource);
    });
  });

  describe('exported configuration', function () {
    it('applies custom substitutions from extension JSON', function () {
      const filter = filterFromExport();

      expect(filter.replaceText('Bad sample.')).to.equal('Good piece.');
    });

    it('uses the default substitution when sub is empty', function () {
      const filter = filterFromExport();

      expect(filter.replaceText('A blank statement.')).to.equal('A censored statement.');
    });

    it('preserves case and leaves allowlisted matches unchanged', function () {
      const filter = filterFromExport();

      expect(filter.replaceText('Class is an OKPhrase.')).to.equal('Class is an OKPhrase.');
    });

    it('filters a selected wordlist without using words assigned to other lists', function () {
      const filter = filterFromExport();

      expect(filter.replaceText('Bad sample.', 1)).to.equal('Bad piece.');
    });

    it('censors with the exported character while preserving the first letter', function () {
      const config = configFromExport();
      config.filterMethod = Constants.FILTER_METHODS.CENSOR;
      const filter = new Filter();
      filter.cfg = config;
      filter.init();

      expect(filter.replaceText('Bad врата A+')).to.equal('B** в**** A*');
    });
  });

  describe('instances', function () {
    it('keeps configuration and match counters independent', function () {
      const first = filterFromExport();
      const second = filterFromExport();
      first.cfg.words.bad.sub = 'altered';
      first.cfg.wordAllowlist.push('sample');
      first.rebuildWordlists();

      expect(first.replaceText('Bad sample.')).to.equal('Altered sample.');
      expect(second.replaceText('Bad sample.')).to.equal('Good piece.');
      expect(first.counter).to.equal(1);
      expect(second.counter).to.equal(2);
    });
  });
});
