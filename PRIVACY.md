# Privacy Policy

This is the privacy policy for Advanced Profanity Filter. There are **_no external connections_** made by the Filter. There are **_no analytics_** collected by the Filter. The Filter is **open source**, so feel free to look it over if you'd like. The Filter only modifies the pages that you visit to _filter_ profanity (or words/phrases that you configure). Your **privacy** is very important to me, and I will do _everything I can_ to preserve it. Below is a list of the **_permissions_** used by the Filter, along with _explanations_ of how they are used.

## URL Permissions (pages the Filter can run on)

- `<all_urls>`: Because this Filter was designed to filter profanity text found on any webpage, it requires permission to run on all pages. This is the highest level of permission an Extension/Add-on can usually request, so care should be taken before granting it. _As stated above_, the Filter does **not** connect to an external service, and **no** analytics/metrics are gathered. This level of permission is required for the Filter to be able to run on all the web pages that you visit (in the options you can control which pages it actually runs on). It can "change" all data on the websites you visit so that it can modify the page to filter profanity/undesired text.

## Required Permissions

- `contextMenus`: Provide shortcuts to common tasks
  - Add new words to Filter (current selection)
  - Toggle (enable/disable) the Filter for the current domain
  - Toggle (enable/disable) advanced mode for the current domain
  - Open the Options page
- `notifications`: Show notification when the Filter is updated (can be disabled in options)
- `storage`: Store all of your customizations related to the Filter
  - Note: If your browser has sync enabled for your Extension/Add-on data, your configuration will be transmitted using the mechanisms that they implement and employ
- `tabs`: Used to access data about the current tab
  - Allow tab audio muting
  - Provide count of filtered words/phrases in icon badge
  - Ability to reload a tab after adjusting Filter options (enable/disable/adding a new word or phrase)

## Optional Permissions

- `file://*/*`: Allow the Filter to run on files stored on the local system.
