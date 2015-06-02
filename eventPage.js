// Open options page if extension icon is clicked
chrome.browserAction.onClicked.addListener(function() {chrome.runtime.openOptionsPage();});

// Set defaults on installation
chrome.runtime.onInstalled.addListener(function(){});
