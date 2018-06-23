// tsc --outfile ./dist/popup.js ./src/helper.ts ./src/config.ts ./src/domain.ts ./src/popup.ts --target es6
/// <reference path="config.ts" />
/// <reference path="helper.ts" />

class ExtOption {
  cfg: Config;
  authenticated: boolean;

  static activate(element) {
    element.classList.add('active');
  }

  authenticate(event) {
    let self = this;
    let passwordInput = document.getElementById('password') as HTMLInputElement;
    if (passwordInput.value == self.cfg.password) {
      self.authenticated = true;
      ExtOption.hide(document.getElementById('passwordContainer'));
      ExtOption.show(document.getElementById('main'));
    }
  }

  censorCharacter(event) {
    let censorCharacterSelect = document.getElementById('censorCharacterSelect') as HTMLSelectElement;
    this.cfg.censorCharacter = censorCharacterSelect.value;
    // this.saveOptions(event, cfg); TODO
  }

  censorFixedLength(event) {
    let censorFixedLengthSelect = document.getElementById('censorFixedLengthSelect') as HTMLSelectElement;
    this.cfg.censorFixedLength = censorFixedLengthSelect.selectedIndex;
    // saveOptions(event, cfg); TODO
  }

  // Prompt for confirmation
  confirm(event, action) {
    // // TODO: Don't confirm if Firefox
    // if (/Chrome/.exec(navigator.userAgent)) {
    //   var dialogContainer = document.getElementById('dialogContainer');
    //   dialogContainer.innerHTML = '<dialog id="promptDialog">Are you sure?<br><button id="confirmYes">Yes</button><button id="confirmNo">No</button></dialog>';
    //   var dialog = document.getElementById("promptDialog") as HTMLDialogElement;

    //   document.getElementById('confirmNo').addEventListener("click", function() {
    //     this.removeEventListener('click', arguments.callee, false);
    //     dialog.close();
    //   })
    //   document.getElementById('confirmYes').addEventListener("click", function() {
    //     this.removeEventListener('click', arguments.callee, false);
    //     if (action == 'importConfig') {
    //       importConfig(event);
    //     } else if (action == 'restoreDefaults') {
    //       restoreDefaults();
    //     }
    //     dialog.close();
    //   })

    //   dialog.showModal();
    // } else {
      if (action == 'importConfig') {
        importConfig(event);
      } else if (action == 'restoreDefaults') {
        restoreDefaults();
      }
    // }
  }

  deactivate(element) {
    element.classList.remove('active');
  }

  domainAdd(event) {
    let domainInput = document.getElementById('domainText') as HTMLInputElement;
    if (domainInput.value != "") {
      if (domainInput.checkValidity()) {
        if (!arrayContains(cfg.disabledDomains, domainInput.value)) {
          cfg.disabledDomains.push(domainInput.value);
          cfg.disabledDomains = cfg.disabledDomains.sort();
          saveOptions(event, cfg);
          domainInput.value = "";
        } else {
          updateStatus('Domain already in list.', true, 3000);
        }
      } else {
        updateStatus("Invalid domain, please only provide the domain name.", true, 5000);
      }
    }
  }

  domainRemove(event) {
    let domainSelect = document.getElementById('domainSelect') as HTMLSelectElement;
    if (domainSelect.value != "") {
      cfg.disabledDomains = removeFromArray(cfg.disabledDomains, domainSelect.value);
      saveOptions(event, cfg);
    }
  }

  exportConfig() {
    // // TODO: To let people migrate from wordList to words, return all keys (null)
    // chrome.storage.sync.get(null, function(settings) {
    //   if (Object.keys(settings).length === 0 && settings.constructor === Object) {
    //     settings = defaults;
    //   }
    //   let configText = document.getElementById('configText') as HTMLTextAreaElement;
    //   configText.value = JSON.stringify(settings, null, 2);
    // });
  }

  filterMethodSelect(event) {
    let filterMethodSelectEm = document.getElementById('filterMethodSelect') as HTMLSelectElement;
    cfg.filterMethod = filterMethodSelectEm.selectedIndex;
    cfg.save();
  }

  globalMatchMethod(event) {
    let globalMatchMethodSelect = document.getElementById('globalMatchMethodSelect') as HTMLSelectElement;
    cfg.globalMatchMethod = globalMatchMethodSelect.selectedIndex;
    cfg.save();
  }

  static hide(element) {
    element.classList.remove('visible');
    element.classList.add('hidden');
  }

  importConfig(event) {
    try {
      let configText = document.getElementById('configText') as HTMLTextAreaElement;
      let settings = JSON.parse(configText.value);
      saveOptions(event, settings);
    } catch (e) {
      updateStatus('Settings not saved! Please try again.', true, 5000);
    }
  }

  // TODO: Migrate wordList to new words object
  migrateWordList() {
    chrome.storage.sync.get('wordList', function(storage) {
      var wordListStr = storage.wordList;

      if (wordListStr != undefined && wordListStr != '') {
        var word = '';
        var wordList = wordListStr.split(',');

        try {
          // Migrate to new words object
          for (let i = 0; i < wordList.length; i++) {
            word = wordList[i];
            if (word != "") {
              if (!arrayContains(Object.keys(cfg.words), word)) {
                console.log('Migrating word: ' + word);
                cfg.words[word] = {"matchMethod": 0, "words": []};
              } else {
                console.log('Word already in list: ' + word);
              }
            }
          }

          // Remove wordList if successful
          console.log(wordListStr, wordList);
          saveOptions(undefined, cfg);
          chrome.storage.sync.remove('wordList');
        }
        catch(error) {
          console.log('Error: Aborting wordList migration!', error);
        }
      }
    });
  }

  // Switching Tabs
  openTab(event) {
    // Don't run on current tab
    if ( event.currentTarget.className.indexOf('active') >= 0) {
      return false;
    }

    // Set active tab
    let oldTab = document.getElementsByClassName("tablinks active")[0];
    deactivate(oldTab);
    activate(event.currentTarget);

    // Show active tab content
    let oldTabContent = document.getElementsByClassName("tabcontent visible")[0];
    hide(oldTabContent);
    let newTabName = event.currentTarget.innerText;
    show(document.getElementById(newTabName));
  }

  // Restores form state to saved values from Chrome Storage
  async populateOptions() {
    let cfg = await Config.build();
    // migrateWordList(); // TODO: Migrate wordList

    // console.log('Password:', cfg.password, 'Authenticated:', authenticated); // DEBUG Password
    if (cfg.password && !authenticated) {
      // console.log('Prompt for password'); // DEBUG Password
      hide(document.getElementById('main'));
      show(document.getElementById('passwordContainer'));
    }

    // Show/hide censor options and word substitutions based on filter method
    dynamicList(Config._filterMethodNames, 'filterMethodSelect');
    let filterMethodSelect = document.getElementById('filterMethodSelect') as HTMLSelectElement;
    filterMethodSelect.selectedIndex = cfg.filterMethod;
    switch (cfg.filterMethod) {
      case 0:
        show(document.getElementById('optionsCensor'));
        hide(document.getElementById('optionsSubstitution'));
        show(document.getElementById('globalMatchMethod'));
        hide(document.getElementById('wordSubstitutions'));
        break;
      case 1:
        hide(document.getElementById('optionsCensor'));
        show(document.getElementById('optionsSubstitution'));
        show(document.getElementById('globalMatchMethod'));
        show(document.getElementById('wordSubstitutions'));
        break;
      case 2:
        hide(document.getElementById('optionsCensor'));
        hide(document.getElementById('optionsSubstitution'));
        hide(document.getElementById('globalMatchMethod'));
        hide(document.getElementById('wordSubstitutions'));
        break;
    }

    // Hide per-word matching options if not selected globally (always show for Remove filter method)
    if (cfg.globalMatchMethod == 3 || cfg.filterMethod == 2) {
      show(document.getElementById('wordMatchMethodContainer'));
    } else {
      hide(document.getElementById('wordMatchMethodContainer'));
    }

    // Settings
    let censorFixedLengthSelect = document.getElementById('censorFixedLengthSelect') as HTMLSelectElement;
    let censorCharacterSelect = document.getElementById('censorCharacterSelect') as HTMLSelectElement;
    let preserveFirst = document.getElementById('preserveFirst') as HTMLInputElement;
    let preserveLast = document.getElementById('preserveLast') as HTMLInputElement;
    let substitutionMark = document.getElementById('substitutionMark') as HTMLInputElement;
    let showCounter = document.getElementById('showCounter') as HTMLInputElement;
    let globalMatchMethodSelect = document.getElementById('globalMatchMethodSelect') as HTMLSelectElement;

    censorFixedLengthSelect.selectedIndex = cfg.censorFixedLength;
    censorCharacterSelect.value = cfg.censorCharacter;
    preserveFirst.checked = cfg.preserveFirst;
    preserveLast.checked = cfg.preserveLast;
    substitutionMark.checked = cfg.substitutionMark;
    showCounter.checked = cfg.showCounter;
    dynamicList(Config._matchMethodNames.slice(0, -1), 'globalMatchMethodSelect');
    globalMatchMethodSelect.selectedIndex = cfg.globalMatchMethod;
    // Words
    dynamicList(Object.keys(cfg.words).sort(), 'wordSelect', 'Words to Filter');
    dynamicList([], 'substitutionSelect', 'Substitutions');
    dynamicList([], 'wordMatchMethodSelect', 'Select a Word');
    // Domains
    dynamicList(cfg.disabledDomains, 'domainSelect', 'Disabled Domains');
  }

  // Restore default settings
  async restoreDefaults() {
    exportConfig();
    let error = await cfg.reset();
    if (error) {
      updateStatus('Error restoring defaults!', true, 5000);
    } else {
      updateStatus('Default settings restored!', false, 3000);
    }
    populateOptions();
  }

  // Saves options to sync storage
  async saveOptions(event, settings?) {
    // Gather current settings
    let preserveFirst = document.getElementById('preserveFirst') as HTMLInputElement;
    let preserveLast = document.getElementById('preserveLast') as HTMLInputElement;
    let showCounter = document.getElementById('showCounter') as HTMLInputElement;
    let substitutionMark = document.getElementById('substitutionMark') as HTMLInputElement;

    if (settings === undefined) {
      settings = {};
      settings.preserveFirst = preserveFirst.checked;
      settings.preserveLast = preserveLast.checked;
      settings.showCounter = showCounter.checked;
      settings.substitutionMark = substitutionMark.checked;
    }

    // Save settings
    let error = await cfg.save();
    if (error) {
      updateStatus('Settings not saved! Please try again.', true, 5000);
    } else {
      populateOptions();
    }
  }

  setPassword() {
    var password = document.getElementById('setPassword') as HTMLInputElement;
    if (password.value == '') {
      chrome.storage.sync.remove('password');
    } else {
      chrome.storage.sync.set({password: password.value});
      password.value = '';
    }
  }

  static show(element) {
    element.classList.remove('hidden');
    element.classList.add('visible');
  }

  substitutionAdd(event) {
    let wordSelect = document.getElementById('wordSelect') as HTMLSelectElement;
    let substitutionText = document.getElementById('substitutionText') as HTMLInputElement;

    let word = wordSelect.value;
    let sub = substitutionText.value;
    if (word != "" && sub != "") {
      if (!arrayContains(cfg.words[word].words, sub)) {
        cfg.words[word].words.push(sub);
        cfg.words[word].words = cfg.words[word].words.sort();
        saveOptions(event, cfg);
        dynamicList(cfg.words[word].words, 'substitutionSelect', 'Substitutions');
        substitutionText.value = "";
      } else {
        updateStatus('Substitution already in list.', true, 3000);
      }
    }
  }

  substitutionLoad() {
    if (cfg.filterMethod === 1) {
      var selectedOption = this[this.selectedIndex];
      var selectedText = selectedOption.text;
      dynamicList(cfg.words[selectedText].words, 'substitutionSelect', 'Substitutions');
    }
  }

  substitutionRemove(event) {
    let wordSelect = document.getElementById('wordSelect') as HTMLSelectElement;
    let substitutionSelect = document.getElementById('substitutionSelect') as HTMLSelectElement;

    let word = wordSelect.value;
    let sub = substitutionSelect.value;
    if (word != "" && sub != "") {
      cfg.words[word].words = removeFromArray(cfg.words[word].words, sub);
      saveOptions(event, cfg);
    }
  }

  // Display status update to user
  static updateStatus(message, error, timeout) {
    var status = document.getElementById('status');
    if (error) {status.className = 'error';}
    status.textContent = message;
    setTimeout(function() {status.textContent = ''; status.className = '';}, timeout);
  }

  wordAdd(event) {
    let wordText = document.getElementById('wordText') as HTMLInputElement;
    let word = wordText.value;
    if (word != "") {
      if (!arrayContains(Object.keys(cfg.words), word)) {
        if (/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/.test(word)) {
          cfg.words[word] = {"matchMethod": 1, "words": []};
        } else {
          cfg.words[word] = {"matchMethod": 0, "words": []};
        }
        saveOptions(event, cfg);
        wordText.value = "";
      } else {
        updateStatus('Word already in list.', true, 3000);
      }
    }
  }

  wordMatchMethodLoad(event) {
    var selectedOption = this[this.selectedIndex];
    var selectedText = selectedOption.text;
    dynamicList(Config._matchMethodNames.slice(0,-2).concat(Config._matchMethodNames.slice(-1)), 'wordMatchMethodSelect');
    let wordMatchMethodSelect = document.getElementById('wordMatchMethodSelect') as HTMLSelectElement;
    wordMatchMethodSelect.value = Config._matchMethodNames[cfg.words[selectedText].matchMethod];
  }

  wordMatchMethodSet(event) {
    let wordSelect = document.getElementById('wordSelect') as HTMLSelectElement;
    let matchMethodSelect = document.getElementById('wordMatchMethodSelect') as HTMLSelectElement;
    cfg.words[wordSelect.value].matchMethod = Config._matchMethodNames.indexOf(matchMethodSelect.value);
    saveOptions(event, cfg);
  }

  wordRemove(event) {
    let wordSelect = document.getElementById('wordSelect') as HTMLSelectElement;
    let word = wordSelect.value;
    if (word != "") {
      delete cfg.words[word];
      saveOptions(event, cfg);
    }
  }
}

let option = new ExtOption;

////
// Add event listeners to DOM
window.addEventListener('load', function(event) { option.populateOptions(); });
let tabs = document.getElementsByClassName("tablinks");
for (let i = 0; i < tabs.length; i++) {
  tabs[i].addEventListener('click', function(e) { openTab(e); });
}
// Filter
document.getElementById('filterMethodSelect').addEventListener('change', filterMethodSelect);
// Filter - Censor
document.getElementById('preserveFirst').addEventListener('click', saveOptions);
document.getElementById('preserveLast').addEventListener('click', saveOptions);
document.getElementById('censorCharacterSelect').addEventListener('change', censorCharacter);
document.getElementById('censorFixedLengthSelect').addEventListener('change', censorFixedLength);
// Filter - Substitute
document.getElementById('substitutionMark').addEventListener('click', saveOptions);
// Global Matching Method
document.getElementById('globalMatchMethodSelect').addEventListener('change', globalMatchMethod);
// General
document.getElementById('showCounter').addEventListener('click', saveOptions);
// Words
document.getElementById('wordAdd').addEventListener('click', wordAdd);
document.getElementById('wordRemove').addEventListener('click', wordRemove);
document.getElementById('wordSelect').addEventListener('change', substitutionLoad);
document.getElementById('wordSelect').addEventListener('change', wordMatchMethodLoad);
document.getElementById('wordMatchMethodSet').addEventListener('click', wordMatchMethodSet);
document.getElementById('substitutionAdd').addEventListener('click', substitutionAdd);
document.getElementById('substitutionRemove').addEventListener('click', substitutionRemove);
// Domains
document.getElementById('domainAdd').addEventListener('click', domainAdd);
document.getElementById('domainRemove').addEventListener('click', domainRemove);
// Config
document.getElementById('default').addEventListener('click', function(event) {confirm(event, 'restoreDefaults')} );
document.getElementById('import').addEventListener('click', function(event) {confirm(event, 'importConfig')} );
document.getElementById('export').addEventListener('click', exportConfig);
// Password
document.getElementById('submitPassword').addEventListener('click', authenticate);
document.getElementById('setPasswordBtn').addEventListener('click', setPassword);