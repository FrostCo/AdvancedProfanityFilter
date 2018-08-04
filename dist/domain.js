var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class Domain {
    static domainMatch(domain, domains) {
        let result = false;
        for (let x = 0; x < domains.length; x++) {
            if (domains[x]) {
                let domainRegex = new RegExp('(^|\.)' + domains[x]);
                if (domainRegex.test(domain)) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    }
    static getCurrentTab() {
        return new Promise(function (resolve, reject) {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                resolve(tabs[0]);
            });
        });
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.tab = yield Domain.getCurrentTab();
            this.url = new URL(this.tab.url);
            this.hostname = this.url.hostname;
        });
    }
}
