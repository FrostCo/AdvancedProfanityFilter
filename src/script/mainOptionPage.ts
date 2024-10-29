import OptionPage from '@APF/optionPage';

const option = new OptionPage;

////
// Events
// Add event listeners to DOM
window.addEventListener('load', (evt) => { option.init(); });
document.querySelectorAll('#menu a').forEach((el) => { el.addEventListener('click', (evt) => { option.switchPage(evt.target as HTMLAnchorElement); }); });
// Modals
document.getElementById('submitPassword').addEventListener('click', (evt) => { option.auth.authenticate(evt.target as HTMLButtonElement); });
document.getElementById('confirmModalBackup').addEventListener('click', (evt) => { option.confirmModalBackup(); });
document.getElementById('confirmModalOK').addEventListener('click', (evt) => { option.closeModal('confirmModal'); });
document.getElementById('confirmModalCancel').addEventListener('click', (evt) => { option.closeModal('confirmModal'); });
document.getElementById('statusModalOK').addEventListener('click', (evt) => { option.closeModal('statusModal'); });
document.getElementById('bulkEditorAddWord').addEventListener('click', (evt) => { option.bulkEditorAddRow(); });
document.getElementById('bulkEditorAddWords').addEventListener('click', (evt) => { option.bulkEditorAddWords(); });
document.getElementById('bulkEditorCancel').addEventListener('click', (evt) => { option.closeModal('bulkWordEditorModal'); });
document.getElementById('bulkEditorSave').addEventListener('click', (evt) => { option.confirm('bulkEditorSave'); });
document.getElementById('bulkEditorRemoveAll').addEventListener('click', (evt) => { option.bulkEditorRemoveAll(); });
// Settings
document.querySelectorAll('#filterMethod input').forEach((el) => { el.addEventListener('click', (evt) => { option.selectFilterMethod(evt.target as HTMLInputElement); }); });
document.getElementById('censorCharacterSelect').addEventListener('change', (evt) => { option.saveOptions(); });
document.getElementById('censorFixedLengthSelect').addEventListener('change', (evt) => { option.saveOptions(); });
document.getElementById('defaultWordMatchMethodSelect').addEventListener('change', (evt) => { option.saveOptions(); });
document.getElementById('defaultWordRepeat').addEventListener('click', (evt) => { option.saveOptions(); });
document.getElementById('defaultWordSeparators').addEventListener('click', (evt) => { option.saveOptions(); });
document.getElementById('preserveCase').addEventListener('click', (evt) => { option.saveOptions(); });
document.getElementById('preserveFirst').addEventListener('click', (evt) => { option.saveOptions(); });
document.getElementById('preserveLast').addEventListener('click', (evt) => { option.saveOptions(); });
document.getElementById('useDeviceTheme').addEventListener('click', (evt) => { option.updateUseSystemTheme(evt.target as HTMLInputElement); });
document.getElementById('showContextMenu').addEventListener('click', (evt) => { option.updateContextMenu(evt.target as HTMLInputElement); });
document.getElementById('showCounter').addEventListener('click', (evt) => { option.saveOptions(); });
document.getElementById('showSummary').addEventListener('click', (evt) => { option.saveOptions(); });
document.getElementById('showUpdateNotification').addEventListener('click', (evt) => { option.saveOptions(); });
document.getElementById('filterWordList').addEventListener('click', (evt) => { option.filterWordListUpdate(); });
document.getElementById('substitutionMark').addEventListener('click', (evt) => { option.saveOptions(); });
document.getElementById('defaultWordSubstitutionText').addEventListener('change', (evt) => { option.saveOptions(); });
// Words/Phrases
document.getElementById('wordList').addEventListener('change', (evt) => { option.populateWord(); });
document.getElementById('wordText').addEventListener('input', (evt) => { option.hideInputError(evt.target as HTMLInputElement); });
document.getElementById('substitutionText').addEventListener('input', (evt) => { option.hideInputError(evt.target as HTMLInputElement); });
document.getElementById('wordSave').addEventListener('click', (evt) => { option.saveWord(); });
document.getElementById('wordRemove').addEventListener('click', (evt) => { option.removeWord(evt.target as HTMLButtonElement); });
document.getElementById('wordRemoveAll').addEventListener('click', (evt) => { option.confirm('removeAllWords'); });
document.getElementById('bulkWordEditorButton').addEventListener('click', (evt) => { option.showBulkWordEditor(); });
// Lists
document.getElementById('allowlistSelect').addEventListener('change', (evt) => { option.populateAllowlistWord(); });
document.getElementById('allowlistText').addEventListener('input', (evt) => { option.hideInputError(evt.target as HTMLInputElement); });
document.getElementById('allowlistSave').addEventListener('click', (evt) => { option.saveAllowlist(); });
document.getElementById('allowlistRemove').addEventListener('click', (evt) => { option.removeAllowlist(); });
document.getElementById('wordlistsEnabled').addEventListener('click', (evt) => { option.saveOptions(); });
document.getElementById('wordlistRename').addEventListener('click', (evt) => { option.renameWordlist(); });
document.getElementById('wordlistSelect').addEventListener('change', (evt) => { option.populateWordlist(); });
document.getElementById('wordlistText').addEventListener('input', (evt) => { option.hideInputError(evt.target as HTMLInputElement); });
document.getElementById('textWordlistSelect').addEventListener('change', (evt) => { option.setDefaultWordlist(evt.target as HTMLSelectElement); });
// Domains
document.querySelectorAll('#domainMatchMode input').forEach((el) => { el.addEventListener('click', (evt) => { option.saveOptions(); }); });
document.getElementById('domainFilterAllFrames').addEventListener('change', (evt) => { option.saveOptions(); });
document.getElementById('domainSelect').addEventListener('change', (evt) => { option.populateDomain(); });
document.getElementById('domainText').addEventListener('input', (evt) => { option.hideInputError(evt.target as HTMLInputElement); });
document.getElementById('domainSave').addEventListener('click', (evt) => { option.saveDomain(); });
document.getElementById('domainRemove').addEventListener('click', (evt) => { option.removeDomain(); });
// Bookmarklet
document.querySelectorAll('#bookmarkletConfigInputs input').forEach((el) => { el.addEventListener('click', (evt) => { option.populateBookmarkletPage(); }); });
// Config
document.getElementById('configSyncLargeKeys').addEventListener('click', (evt) => { option.confirm('convertStorageLocation'); });
document.getElementById('configInlineInput').addEventListener('click', (evt) => { option.configInlineToggle(); });
document.getElementById('importFileInput').addEventListener('change', (evt) => { option.importConfigFile(evt.target as HTMLInputElement, (evt.target as HTMLInputElement).files); });
document.getElementById('configReset').addEventListener('click', (evt) => { option.confirm('restoreDefaults'); });
document.getElementById('configExport').addEventListener('click', (evt) => { option.exportConfig(); });
document.getElementById('configImport').addEventListener('click', (evt) => { option.confirm('importConfig'); });
document.getElementById('configLoggingLevelSelect').addEventListener('change', (evt) => { option.saveOptions(); });
document.getElementById('setPassword').addEventListener('input', (evt) => { option.auth.setPasswordButton(); });
document.getElementById('setPasswordBtn').addEventListener('click', (evt) => { option.confirm('setPassword'); });
// Test
document.getElementById('testText').addEventListener('input', (evt) => { option.populateTest(); });
// Stats
document.getElementById('collectStats').addEventListener('click', (evt) => { option.saveOptions(); });
document.getElementById('statsExport').addEventListener('click', (evt) => { option.exportStats(); });
document.getElementById('statsImport').addEventListener('click', (evt) => { option.confirm('statsImport'); });
document.getElementById('statsImportInput').addEventListener('change', (evt) => { option.importStatsFile(evt.target as HTMLInputElement, (evt.target as HTMLInputElement).files); });
document.getElementById('statsReset').addEventListener('click', (evt) => { option.confirm('statsReset'); });
document.getElementById('lessUsedWordsNumber').addEventListener('input', (evt) => { option.hideInputError(evt.target as HTMLInputElement); });
document.getElementById('removeLessUsedWords').addEventListener('click', (evt) => { option.confirm('removeLessUsedWords'); });
// Help
document.querySelectorAll('div#helpContainer a').forEach((anchor) => { anchor.setAttribute('target', '_blank'); });
// Other
document.getElementsByClassName('themes')[0].addEventListener('click', (evt) => { option.toggleTheme(); });
