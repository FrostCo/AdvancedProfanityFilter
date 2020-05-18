export default class Bookmarklet {
  hostedUrl: string

  static readonly _defaultBookmarklet = 'javascript:(function()%7Bif(!document.querySelector(%22script.apfBookmarklet%22))%7Blet%20apfScriptEl%3Ddocument.body.appendChild(document.createElement(%22script%22))%3BapfScriptEl.type%3D%22text%2Fjavascript%22%3BapfScriptEl.src%3D%22https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2Frichardfrost%2FAdvancedProfanityFilter%40master%2Fbookmarklet.js%22%3BapfScriptEl.className%3D%22apfBookmarklet%22%3B%7D%7D)()'
  static readonly _defaultFilename = 'apfBookmarklet.js';
  static readonly dropboxRegExp = /^https:\/\/www\.dropbox\.com\/[a-z]\/\w+?\/[\w\-\.]+?\?dl=0$/;
  static readonly gitHubGistLinkRegExp = /^https:\/\/gist\.github\.com\/([\w\-]+?)\/([\w\-]+?)$/;
  static readonly gitHubGistRawRegExp = /^https:\/\/gist\.githubusercontent\.com\/([\w\-]+?)\/([\w\-]+?)\/raw\/[\w\-]+?\/([\w\-.]+?)$/;
  static readonly githubRawRegExp = /^https:\/\/raw\.githubusercontent\.com\/([\w-]+?)\/([\w-]+?)\/([\w-]+?)\/([\w-.]+?)$/;
  static readonly googleDriveRegExp = /^https:\/\/drive\.google\.com\/file\/[a-z]\/(.+?)\/view/;

  // Input (share link): https://www.dropbox.com/s/id/apfBookmarklet.js?dl=0
  // Output: https://dl.dropbox.com/s/id/apfBookmarklet.js?raw=1
  static dropboxDownloadURL(url: string): string {
    let match = url.match(Bookmarklet.dropboxRegExp);
    if (match) {
      return url.replace(/\/www\./, '/dl.').replace(/\?dl=0/, '?raw=1');
    }
    return url;
  }

  // Input: https://raw.githubusercontent.com/user/project/branch/apfBookmarklet.js
  // Output: https://cdn.jsdelivr.net/gh/user/project@branch/apfBookmarklet.js
  static githubDownloadURL(url: string): string {
    let match = url.match(Bookmarklet.githubRawRegExp);
    if (match && match[1] && match[2] && match[3] && match[4]) {
      let user = match[1];
      let project = match[2];
      let branch = match[3];
      let filename = match[4];
      return `https://cdn.jsdelivr.net/gh/${user}/${project}@${branch}/${filename}`;
    }
    return url;
  }

  // Input (raw): https://gist.githubusercontent.com/user/gist_id/raw/revision_id/apfBookmarklet.js
  // Input (uses default filename): https://gist.github.com/user/gist_id
  // Output: https://cdn.statically.io/gist/user/gist_id/raw/apfBookmarklet.js?env=dev
  static gitHubGistDownloadURL(url: string): string {
    let match = url.match(Bookmarklet.gitHubGistRawRegExp);
    if (match && match[1] && match[2]) {
      let user = match[1];
      let gistId = match[2];
      let filename = match[3];
      return `https://cdn.statically.io/gist/${user}/${gistId}/raw/${filename}?env=dev`;
    } else {
      match = url.match(Bookmarklet.gitHubGistLinkRegExp);
      if (match && match[1] && match[2]) {
        let user = match[1];
        let gistId = match[2];
        return `https://cdn.statically.io/gist/${user}/${gistId}/raw/${Bookmarklet._defaultFilename}?env=dev`;
      }
    }

    return url;
  }

  // Input (share link): https://drive.google.com/file/d/id/view?usp=sharing
  // Output: https://drive.google.com/uc?export=view&id=id
  static googleDriveDownloadURL(url: string): string {
    let match = url.match(Bookmarklet.googleDriveRegExp);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
  }

  static processDownloadURL(url: string): string {
    let originalUrl = url;
    if (originalUrl === url) { url = Bookmarklet.dropboxDownloadURL(url); }
    if (originalUrl === url) { url = Bookmarklet.githubDownloadURL(url); }
    if (originalUrl === url) { url = Bookmarklet.gitHubGistDownloadURL(url); }
    if (originalUrl === url) { url = Bookmarklet.googleDriveDownloadURL(url); }
    return url;
  }

  static async injectConfig(config = null): Promise<string> {
    const prefix = '/* @preserve - Start User Config */';
    const postfix = '/* @preserve - End User Config */';
    const configRegExp = new RegExp(`${prefix.replace(/[\/\*]/g, '\\$&')}[\\S\\s]\*${postfix.replace(/[\/\*]/g, '\\$&')}`, 'm');
    const origURL = './bookmarkletFilter.js';
    const lowerCaseLettersRegExp = new RegExp('^[a-z]$');

    let response = await fetch(origURL);
    let code = await response.text();
    let cfgCode = code.match(configRegExp).toString();
    try {
      let variable = cfgCode.match(/^let ([a-z])=/m)[1];
      if (lowerCaseLettersRegExp.test(variable)) {
        return code.replace(configRegExp, `${prefix}\nlet ${variable}=${JSON.stringify(config)}\n${postfix}`);
      } else {
        throw('Unable to set user config - using defaults');
      }
    } catch(e) {
      window.alert('Unable to read config - using defaults');
      return code;
    }
  }

  constructor(url: string) {
    this.hostedUrl = Bookmarklet.processDownloadURL(url);
  }

  destination(): string {
    let prefix = '(function(){if(!document.querySelector("script.apfBookmarklet")){let apfScriptEl=document.body.appendChild(document.createElement("script"));apfScriptEl.type="text/javascript";apfScriptEl.src="';
    let postfix = '";apfScriptEl.className="apfBookmarklet";}})()';
    return 'javascript:' + encodeURIComponent(prefix + this.hostedUrl + postfix);
  }
}