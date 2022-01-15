export default class Bookmarklet {
  hostedUrl: string;

  static readonly _defaultBookmarklet = 'https://raw.githubusercontent.com/richardfrost/AdvancedProfanityFilter/master/bookmarklet.js';
  static readonly _defaultFilename = 'apfBookmarklet.js';
  static readonly dropboxRegExp = /^https:\/\/www\.dropbox\.com\/[a-z]\/\w+?\/[\w\-\.]+?\?dl=0$/;
  static readonly gitHubGistLinkRegExp = /^https:\/\/gist\.github\.com\/([\w\-]+?)\/([\w\-]+?)$/;
  static readonly gitHubGistRawRegExp = /^https:\/\/gist\.githubusercontent\.com\/([\w\-]+?)\/([\w\-]+?)\/raw\/[\w\-]+?\/([\w\-.]+?)$/;
  static readonly githubRawRegExp = /^https:\/\/raw\.githubusercontent\.com\/([\w-]+?)\/([\w-]+?)\/([\w-]+?)\/([\w-.]+?)$/;
  static readonly googleDriveRegExp = /^https:\/\/drive\.google\.com\/file\/[a-z]\/(.+?)\/view/;

  // Input (share link): https://www.dropbox.com/s/id/apfBookmarklet.js?dl=0
  // Output: https://dl.dropbox.com/s/id/apfBookmarklet.js?raw=1
  static dropboxDownloadURL(url: string): string {
    const match = url.match(Bookmarklet.dropboxRegExp);
    if (match) {
      return url.replace(/\/www\./, '/dl.').replace(/\?dl=0/, '?raw=1');
    }
    return url;
  }

  // Input: https://raw.githubusercontent.com/user/project/branch/apfBookmarklet.js
  // Output: https://cdn.jsdelivr.net/gh/user/project@branch/apfBookmarklet.js
  static githubDownloadURL(url: string): string {
    const match = url.match(Bookmarklet.githubRawRegExp);
    if (match && match[1] && match[2] && match[3] && match[4]) {
      const user = match[1];
      const project = match[2];
      const branch = match[3];
      const filename = match[4];
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
      const user = match[1];
      const gistId = match[2];
      const filename = match[3];
      return `https://cdn.statically.io/gist/${user}/${gistId}/raw/${filename}?env=dev`;
    } else {
      match = url.match(Bookmarklet.gitHubGistLinkRegExp);
      if (match && match[1] && match[2]) {
        const user = match[1];
        const gistId = match[2];
        return `https://cdn.statically.io/gist/${user}/${gistId}/raw/${Bookmarklet._defaultFilename}?env=dev`;
      }
    }

    return url;
  }

  // Input (share link): https://drive.google.com/file/d/id/view?usp=sharing
  // Output: https://drive.google.com/uc?export=view&id=id
  static googleDriveDownloadURL(url: string): string {
    const match = url.match(Bookmarklet.googleDriveRegExp);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
  }

  static processDownloadURL(url: string): string {
    const originalUrl = url;
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

    const response = await fetch(origURL);
    const code = await response.text();
    const cfgCode = code.match(configRegExp).toString();
    try {
      const variable = cfgCode.match(/^const ([a-z])=/m)[1];
      if (lowerCaseLettersRegExp.test(variable)) {
        return code.replace(configRegExp, `${prefix}\nconst ${variable}=${JSON.stringify(config)}\n${postfix}`);
      } else {
        throw ('Unable to set user config - using defaults');
      }
    } catch (e) {
      window.alert('Unable to read config - using defaults');
      return code;
    }
  }

  constructor(url: string) {
    this.hostedUrl = Bookmarklet.processDownloadURL(url);
  }

  destination(): string {
    const prefix = '(function(){if(!document.querySelector("script.apfBookmarklet")){const apfScriptEl=document.body.appendChild(document.createElement("script"));apfScriptEl.type="text/javascript";apfScriptEl.src="';
    const postfix = '";apfScriptEl.className="apfBookmarklet";}})()';
    return 'javascript:' + encodeURIComponent(prefix + this.hostedUrl + postfix);
  }
}