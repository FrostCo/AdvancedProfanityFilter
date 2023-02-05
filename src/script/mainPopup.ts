import Constants from './lib/constants';
import Popup from './popup';
import Logger from './lib/logger';

const logger = new Logger('Popup');

// Listen for data updates from filter
chrome.runtime.onMessage.addListener((request: Message, sender, sendResponse) => {
  if (request.destination !== Constants.MESSAGING.POPUP) return true;

  if (request.summary) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (sender.tab.id == tabs[0].id) { popup.populateSummary(request.summary); }
    });
  } else if (request.status) {
    popup.updateStatus(request.status);
  } else {
    logger.error('Received unhandled message.', JSON.stringify(request));
  }

  sendResponse(); // Issue 393 - Chrome 99+ promisified sendMessage expects callback to be called
});

// Initial data request
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(
    tabs[0].id,
    { destination: Constants.MESSAGING.CONTEXT, source: Constants.MESSAGING.POPUP, summary: true },
    () => chrome.runtime.lastError // Suppress error if no listener);
  );
});

const popup = new Popup;

////
// Listeners
window.addEventListener('load', (evt) => { popup.populateOptions(); });
document.getElementById('domainFilter').addEventListener('change', (evt) => { popup.toggle(popup.filterToggleProp); });
document.getElementById('domainModeSelect').addEventListener('change', (evt) => { popup.updateDomainMode(); });
document.getElementById('filterMethodSelect').addEventListener('change', (evt) => { popup.filterMethodSelect(); });
document.getElementById('wordlistSelect').addEventListener('change', (evt) => { popup.wordlistSelect(evt.target as HTMLSelectElement); });
document.getElementById('options').addEventListener('click', (evt) => { chrome.runtime.openOptionsPage(); });
