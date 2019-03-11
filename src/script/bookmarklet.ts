export default class Bookmarklet {

  static async injectConfig(config = null): Promise<string> {
    const prefix = '/* << Start User Config >> */';
    const postfix = '/* << End User Config >> */';
    const configRegExp = /\/\* << Start User Config >> \*\/[\S\s]*\/\* << End User Config >> \*\//m;
    let origURL = 'https://gist.githubusercontent.com/richardfrost/01e3cd3368863314253b97b3a6c5082c/raw/apfbookmarklet.js'; // TODO: Fix link
    let response = await fetch(origURL);
    let code = await response.text();
    try {
      return code.replace(configRegExp, prefix + '\nvar config = ' + JSON.stringify(config) + ';\n' + postfix);
    } catch(e) {
      window.alert('Unable to read config - using defaults');
      return code;
    }
  }

  static updateBookmarklet(): string {
    let prefix = "(function(){if(!document.querySelector('script.apfBookmarklet')){let apfScriptEl=document.body.appendChild(document.createElement('script'));apfScriptEl.src='"
    let postfix = "';apfScriptEl.className='apfBookmarklet';}})()";
    let fileURLInput = document.getElementById('bookmarkletHostedURL') as HTMLInputElement;
    let fileURL = fileURLInput.value;
    if (fileURL == '') {
      window.alert('Please enter a file URL');
    } else {
      return 'javascript:' + encodeURIComponent(prefix + fileURL + postfix);
    }
  }
}