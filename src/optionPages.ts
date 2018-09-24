// TODO: Rename words -> subs?
// TODO: Substitute new default?
import { arrayContains, dynamicList, removeFromArray } from './lib/helper.js';
import WebConfig from './webConfig.js';
import {Filter} from './lib/filter.js';
// import OptionTab from './optionTab.js';
// import OptionAuth from './optionAuth.js';

export default class OptionPage {
  cfg: WebConfig;

  static async load(instance: OptionPage) {
    instance.cfg = await WebConfig.build();
  }

  async populateOptions() {
    let self = this;
    await OptionPage.load(self);

    // TODO: HACK
    exampleFilter.cfg = await WebConfig.build();
    filter.cfg = option.cfg;
    console.log(filter.cfg);
    filter.generateWordList();
    filter.generateRegexpList();

    this.populateWordsList();
  }

  populateWordsList() {
    let censorWordsEl = document.getElementById('censorWords') as HTMLInputElement;
    let wordListHTML = [];
    Object.keys(option.cfg.words).forEach(function(word) {
      let displayWord = word;
      // TODO: sidelist censor - Substitution vs censor?
      // TODO: Return a substitution for a word that includes defaults?
      if (censorWordsEl.checked) displayWord = option.cfg.words[word].words[0];
      wordListHTML.push(`<a href="#" class="w3-bar-item w3-button w3-border-bottom" data-word="${word}">` + displayWord +'</a>');
    });
    let wordsSidebarList = document.getElementById('wordsSidebarList') as HTMLElement;

    wordsSidebarList.innerHTML = wordListHTML.join('\n');
    wordsSidebarList.childNodes.forEach(el => { el.addEventListener('click', e => option.populateWord(e)); });
  }

  populateWord(evt) {
    let word = evt.target.dataset.word;
    let wordCfg = option.cfg.words[word];
    let wordText = document.getElementById('wordText') as HTMLInputElement;
    wordText.value = word;

    let selectedMatchMethod = document.getElementById(`wordMatch${WebConfig._matchMethodNames[wordCfg.matchMethod]}`) as HTMLInputElement;
    selectedMatchMethod.checked = true;

    let wordMatchRepeated = document.getElementById('wordMatchRepeated') as HTMLInputElement;
    wordMatchRepeated.checked = wordCfg.repeat;

    option.populateExample(evt);
  }

  populateExample(evt) {
    let wordText = document.getElementById('wordText') as HTMLInputElement;
    let exampleSentenceWord = document.getElementById('exampleSentenceWord') as HTMLElement;

    let matchMethod = document.querySelector('input[name="matchMethod"]:checked') as HTMLInputElement;
    let wordMatchRepeated = document.getElementById('wordMatchRepeated') as HTMLInputElement;

    // Load filter
    exampleFilter.cfg.words = {};
    exampleFilter.cfg.words[wordText.value] = { words: [], matchMethod: WebConfig._matchMethodNames.indexOf(matchMethod.value), repeat: wordMatchRepeated.checked };
    console.log(exampleFilter);
    exampleFilter.wordRegExps = [];
    exampleFilter.generateWordList();
    exampleFilter.generateRegexpList();
    exampleSentenceWord.innerHTML = exampleFilter.replaceText(wordText.value);
    // console.log(exampleFilter);
    console.log(exampleFilter.replaceText(wordText.value));
  }

  populateTest(evt) {
    let testText = document.getElementById('testText') as HTMLInputElement;
    let filteredTestText = document.getElementById('filteredTestText') as HTMLElement;
    console.log(filter);
    filteredTestText.innerText = filter.replaceText(testText.value);
  }

  addNewWord(evt) {
    // TODO: Set form to use cfg defaults
    let wordText = document.getElementById('wordText') as HTMLInputElement;
    wordText.value = '';

    let selectedMatchMethod = document.getElementById(`wordMatch${WebConfig._matchMethodNames[option.cfg.defaultWordMatchMethod]}`) as HTMLInputElement;
    selectedMatchMethod.checked = true;

    let wordMatchRepeated = document.getElementById('wordMatchRepeated') as HTMLInputElement;
    wordMatchRepeated.checked = option.cfg.defaultWordRepeat;
  }

  saveWord(evt) {
    // if word has changed, update and remove old word
  }

  switchPage(ev) {
    let currentTab = document.querySelector('#menu a.w3-purple') as HTMLElement;
    let newTab = ev.target as HTMLElement;

    currentTab.classList.remove('w3-purple');
    newTab.classList.add('w3-purple');

    let currentPage = document.getElementById(currentTab.innerText.toLowerCase() + 'Page') as HTMLElement;
    let newPage = document.getElementById(newTab.innerText.toLowerCase() + 'Page') as HTMLElement;
    currentPage.classList.add('w3-hide');
    newPage.classList.remove('w3-hide');
  }
}

let exampleFilter = new Filter;
let exampleCfg;
let filter = new Filter;
let option = new OptionPage;


////
// Add event listeners to DOM
window.addEventListener('load', function(event) { option.populateOptions(); });
document.getElementById('censorWords').addEventListener('change', e => { option.populateWordsList(); });
document.getElementById('wordAdd').addEventListener('click', e => { option.addNewWord(e); });
document.querySelectorAll('#menu a').forEach(el => { el.addEventListener('click', e => { option.switchPage(e); }); });
document.getElementById('wordText').addEventListener('input', e => { option.populateExample(e); });
document.getElementById('testText').addEventListener('input', e => { option.populateTest(e); });