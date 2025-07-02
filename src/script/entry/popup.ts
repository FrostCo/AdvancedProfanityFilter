import Popup from '@APF/Popup';

const popup = new Popup();

// Use internal help page
(document.getElementById('gettingStarted') as HTMLAnchorElement).href = chrome.runtime.getURL('option-page.html#/help');

// Listeners
document.addEventListener('DOMContentLoaded', (evt) => {
  popup.initializePopup();
});
document.getElementById('domainFilter').addEventListener('change', (evt) => {
  popup.toggle(popup.filterToggleProp);
});
document.getElementById('domainModeSelect').addEventListener('change', (evt) => {
  popup.updateDomainMode();
});
document.getElementById('filterMethodSelect').addEventListener('change', (evt) => {
  popup.filterMethodSelect();
});
document.getElementById('wordlistSelect').addEventListener('change', (evt) => {
  popup.wordlistSelect(evt.target as HTMLSelectElement);
});
document.getElementById('options').addEventListener('click', (evt) => {
  chrome.runtime.openOptionsPage();
});
