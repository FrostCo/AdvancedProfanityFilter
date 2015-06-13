// Open options page if extension icon is clicked
chrome.browserAction.onClicked.addListener(function() {chrome.runtime.openOptionsPage();});

// Actions for extension install or upgrade
chrome.runtime.onInstalled.addListener(function(details){
  if (details.reason == "install"){
    chrome.runtime.openOptionsPage();
  } else if (details.reason == "update") {
    // var thisVersion = chrome.runtime.getManifest().version;
    // console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
  }
});

// Show badge with number of words filtered
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    chrome.browserAction.setBadgeText({text: request.counter, tabId: sender.tab.id});
  }
);