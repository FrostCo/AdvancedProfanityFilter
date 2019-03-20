export default class Bookmarklet {
  hostedUrl: string

  static readonly dropboxRegExp = /^https:\/\/www\.dropbox\.com\/[a-z]\/\w+?\/[\w\-\.]+?\?dl=0$/;
  static readonly gitHubGistRegExp = /^https:\/\/gist\.github\.com\/([\w\-]+?)\/([\w\-]+?)$/;
  static readonly googleDriveRegExp = /^https:\/\/drive\.google\.com\/file\/[a-z]\/(.+?)\/view/;

  static dropboxDownloadURL(url: string): string {
    let match = url.match(Bookmarklet.dropboxRegExp);
    if (match) {
      return url.replace(/\/www\./, '/dl.').replace(/\?dl=0/, '?raw=1');
    }
    return url;
  }

  static gitHubGistDownloadURL(url: string): string {
    let match = url.match(Bookmarklet.gitHubGistRegExp);
    if (match && match[1] && match[2]) {
      // return `https://gist.githubusercontent.com/${match[1]}/${match[2]}/raw`; // Have to use a CDN
      return `https://cdn.statically.com/gist/${match[1]}/${match[2]}/raw/apfBookmarklet.js?env=dev`;
    }
    return url;
  }

  static googleDriveDownloadURL(url: string): string {
    let match = url.match(Bookmarklet.googleDriveRegExp);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
  }

  static processDownloadURL(url: string): string {
    url = Bookmarklet.gitHubGistDownloadURL(url);
    url = Bookmarklet.googleDriveDownloadURL(url);
    url = Bookmarklet.dropboxDownloadURL(url);
    return url;
  }

  static async injectConfig(config = null): Promise<string> {
    const prefix = '/* @preserve - Start User Config */';
    const postfix = '/* @preserve - End User Config */';
    const configRegExp = new RegExp(`${prefix.replace(/[\/\*]/g, '\\$&')}[\\S\\s]\*${postfix.replace(/[\/\*]/g, '\\$&')}`, 'm');
    const origURL = './bookmarkletFilter.js';

    let response = await fetch(origURL);
    let code = await response.text();
    let cfgCode = code.match(configRegExp).toString();
    try {
      let variable = cfgCode.match(/^var ([a-z])=/m)[1];
      if (variable.match(/^[a-z]$/)) {
        return code.replace(configRegExp, `${prefix}\nvar ${variable}=${JSON.stringify(config)}\n${postfix}`);
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
    let prefix = '(function(){if(!document.querySelector("script.apfBookmarklet")){let apfScriptEl=document.body.appendChild(document.createElement("script"));apfScriptEl.src="';
    let postfix = '";apfScriptEl.className="apfBookmarklet";}})()';
    return 'javascript:' + encodeURIComponent(prefix + this.hostedUrl + postfix);
  }
}