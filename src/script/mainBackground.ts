import Background from '@APF/background';

chrome.contextMenus.onClicked.addListener((info, tab) => { Background.contextMenusOnClick(info, tab); });
chrome.runtime.onInstalled.addListener((details) => { Background.onInstalled(details); });
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => { return Background.onMessage(request, sender, sendResponse); });
chrome.runtime.onStartup.addListener(() => { Background.onStartup(); });
chrome.tabs.onRemoved.addListener((tabId) => { Background.tabsOnRemoved(tabId); });
chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => { Background.tabsOnReplaced(addedTabId, removedTabId); });
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { Background.tabsOnUpdated(tabId, changeInfo, tab); });
if (chrome.notifications != null) {
  chrome.notifications.onClicked.addListener((notificationId) => { Background.notificationsOnClick(notificationId); });
}
