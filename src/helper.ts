class Helper {
    static arrayContains(array: String[], element: String) {
        return (array.indexOf(element) > -1);
    }

    static dynamicList(list, selectEm, title?: String) {
        let options = '';
        if (title !== undefined) {
            options = '<option value="" disabled selected>' + title + '</option>';
        }

        for(let i = 0; i < list.length; i++) {
            options += '<option value="'+list[i]+'">'+list[i]+'</option>';
        }
        document.getElementById(selectEm).innerHTML = options;
    }

    static removeFromArray(array: String[], element: String) {
        return array.filter(e => e !== element);
    }

    // function disableDomain(domain) {
    //     chrome.storage.sync.get({"disabledDomains": []}, function(storage) {
    //       if (!arrayContains(storage.disabledDomains, domain)) {
    //         storage.disabledDomains.push(domain);
    //         chrome.storage.sync.set({"disabledDomains": storage.disabledDomains}, function() {
    //           if (!chrome.runtime.lastError) {
    //             chrome.tabs.reload();
    //           }
    //         });
    //       };
    //     });
    // }

    // function disableDomain(domain) {
    //     if (!Helper.arrayContains(disabledDomains, domain)) {
    //       disabledDomains.push(domain);
    //       chrome.storage.sync.set({"disabledDomains": disabledDomains}, function() {
    //         if (!chrome.runtime.lastError) {
    //           disable(document.getElementById('filterMethodSelect'));
    //           chrome.tabs.reload();
    //         }
    //       });
    //     };
    //   }
}