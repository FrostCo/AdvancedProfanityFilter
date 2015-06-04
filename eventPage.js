// Open options page if extension icon is clicked
chrome.browserAction.onClicked.addListener(function() {chrome.runtime.openOptionsPage();});

// // Actions for extension install or upgrade
// chrome.runtime.onInstalled.addListener(function(details){
//   if (details.reason == "install"){
//     console.log('first install');
//     chrome.runtime.openOptionsPage();
//   } else if (details.reason == "update") {
//     var thisVersion = chrome.runtime.getManifest().version;
//     console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
//   }
// });
