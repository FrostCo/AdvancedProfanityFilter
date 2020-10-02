/* istanbul ignore next */
export function dynamicList(list: string[], select: HTMLSelectElement, title?: string) {
  removeChildren(select);
  let array = title !== undefined ? [title].concat(list) : list;

  array.forEach(item => {
    let option = document.createElement('option');
    option.value = (title && item === title) ? '' : item;
    option.textContent = item;
    select.appendChild(option);
  });
}

export function escapeHTML(str: string): string {
  return str.replace(/([<>&"'])/g, (match, p1) => (
    {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;'
    }[p1])
  );
}

export function exportToFile(dataStr, fileName = 'data.txt') {
  let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  let linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', fileName);
  linkElement.click();
  linkElement.remove();
}

// Format numbers up to 1B to be 4 characters or less
export function formatNumber(number: number): string {
  let length = number.toString().length;
  if (length <= 3) { // 0 - 999
    return number.toString();
  } else if (length <= 6) { // 1,000 - 999,999
    let n = (number/1000).toPrecision();
    let index = n.indexOf('.');
    return ((index >= -1 && index <= 1) ? n.substr(0, 3) : n.substr(0, index)) + 'k';
  } else if (length <= 9) { // 1,000,000 - 999,999,999
    let n = (number/1000000).toPrecision();
    let index = n.indexOf('.');
    return ((index >= -1 && index <= 1) ? n.substr(0, 3) : n.substr(0, index)) + 'M';
  } else { // >= 1,000,000,000
    return '1G+';
  }
}

export function getGlobalVariable(code: string, id: string = 'APFData') {
  let script = document.createElement('script');
  script.id = id;
  script.textContent = `document.getElementById("${id}").textContent = JSON.stringify(${code})`;
  document.documentElement.appendChild(script);
  let result = document.querySelector(`script#${id}`).textContent;
  script.remove();
  return JSON.parse(result);
}

// /^\d+\.\d+\.\d+$/
export function getVersion(version: string): Version {
  let versionValues = version.split('.');
  return {
    major: parseInt(versionValues[0]),
    minor: parseInt(versionValues[1]),
    patch: parseInt(versionValues[2])
  };
}

export function injectScript(file, node, id: string = '') {
  var th = document.getElementsByTagName(node)[0];
  var s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  if (id) { s.id = id; }
  s.setAttribute('src', file);
  th.appendChild(s);
}

// Is the provided version lower than the minimum version?
export function isVersionOlder(version: Version, minimum: Version): boolean {
  if (version.major < minimum.major) {
    return true;
  } else if (version.major == minimum.major && version.minor < minimum.minor) {
    return true;
  } else if (version.major == minimum.major && version.minor == minimum.minor && version.patch < minimum.patch) {
    return true;
  }

  return false;
}

export function makeRequest(method: string, url: string) {
  return new Promise(function (resolve, reject) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}

// NOTE: This function requires the hh:mm:ss.ff format
export function hmsToSeconds(timeStr: string, precision: number = 2): number {
  let [hh = '0', mm = '0', ss = '0'] = (timeStr || '0:0:0').split(':');
  let hour = parseInt(hh, 10) || 0;
  let minute = parseInt(mm, 10) || 0;
  let second = parseFloat(ss) || 0;
  return parseFloat(((hour * 3600) + (minute * 60) + second).toFixed(precision));
}

export function readFile(file) {
  return new Promise((resolve, reject) => {
    let fr = new FileReader();
    fr.onload = () => { resolve(fr.result); };
    fr.readAsText(file);
  });
}

export function removeChildren(element) {
  if (element.hasChildNodes) {
    while (element.firstChild) {
      element.firstChild.remove();
    }
  }
}

export function removeFromArray(array: string[], element: string) {
  return array.filter(e => e !== element);
}