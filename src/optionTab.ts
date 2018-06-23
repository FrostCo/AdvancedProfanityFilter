class OptionTab {
  // Switching Tabs
  static openTab(event) {
    // Don't run on current tab
    if ( event.currentTarget.className.indexOf('active') >= 0) {
      return false;
    }

    // Set active tab
    let oldTab = document.getElementsByClassName("tablinks active")[0];
    OptionPage.deactivate(oldTab);
    OptionPage.activate(event.currentTarget);

    // Show active tab content
    let oldTabContent = document.getElementsByClassName("tabcontent visible")[0];
    OptionPage.hide(oldTabContent);
    let newTabName = event.currentTarget.innerText;
    OptionPage.show(document.getElementById(newTabName));
  }
}