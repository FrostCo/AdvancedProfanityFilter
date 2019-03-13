export default class Bookmarklet {
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

  static updateBookmarklet(url: string): string {
    let prefix = "(function(){if(!document.querySelector('script.apfBookmarklet')){let apfScriptEl=document.body.appendChild(document.createElement('script'));apfScriptEl.src='"
    let postfix = "';apfScriptEl.className='apfBookmarklet';}})()";
    return 'javascript:' + encodeURIComponent(prefix + url + postfix);
  }
}