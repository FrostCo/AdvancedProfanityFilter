/* istanbul ignore next */
export function dynamicList(list: string[], select: HTMLSelectElement, upperCaseFirstChar: boolean = false, title?: string) {
  removeChildren(select);
  const array = title !== undefined ? [title].concat(list) : list;

  array.forEach((item) => {
    const option = document.createElement('option');
    option.value = (title && item === title) ? '' : item;
    option.textContent = upperCaseFirstChar ? upperCaseFirst(item) : item;
    select.appendChild(option);
  });
}

export function exportToFile(dataStr, fileName = 'data.txt') {
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', fileName);
  linkElement.click();
  linkElement.remove();
}

// Format numbers up to 1B to be 4 characters or less
export function formatNumber(number: number): string {
  const length = number.toString().length;
  if (length <= 3) { // 0 - 999
    return number.toString();
  } else if (length <= 6) { // 1,000 - 999,999
    const n = (number/1000).toPrecision();
    const index = n.indexOf('.');
    return ((index >= -1 && index <= 1) ? n.substr(0, 3) : n.substr(0, index)) + 'k';
  } else if (length <= 9) { // 1,000,000 - 999,999,999
    const n = (number/1000000).toPrecision();
    const index = n.indexOf('.');
    return ((index >= -1 && index <= 1) ? n.substr(0, 3) : n.substr(0, index)) + 'M';
  } else { // >= 1,000,000,000
    return '1G+';
  }
}

export function getGlobalVariable(code: string, id: string = 'APFData') {
  const script = document.createElement('script');
  script.id = id;
  script.textContent = `document.getElementById("${id}").textContent = JSON.stringify(${code})`;
  document.documentElement.appendChild(script);
  const result = document.querySelector(`script#${id}`).textContent;
  script.remove();
  return JSON.parse(result);
}

// /^\d+\.\d+\.\d+$/
export function getVersion(version: string): Version {
  const versionValues = version.split('.');
  return {
    major: parseInt(versionValues[0]),
    minor: parseInt(versionValues[1]),
    patch: parseInt(versionValues[2])
  };
}

// NOTE: This function requires the hh:mm:ss.ff format
export function hmsToSeconds(timeStr: string, precision: number = 3): number {
  const [hh = '0', mm = '0', ss = '0'] = (timeStr || '0:0:0').split(':');
  const hour = parseInt(hh, 10) || 0;
  const minute = parseInt(mm, 10) || 0;
  const second = parseFloat(ss) || 0;
  return parseFloat(((hour * 3600) + (minute * 60) + second).toFixed(precision));
}

export function injectScript(file, node, id: string = '') {
  const th = document.getElementsByTagName(node)[0];
  const s = document.createElement('script');
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
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function() {
      if (this.status >= 200 && this.status < 300) {
        resolve(this.response);
      } else {
        reject({
          status: this.status,
          statusText: this.statusText
        });
      }
    };
    xhr.onerror = function() {
      reject({
        status: this.status,
        statusText: this.statusText
      });
    };
    xhr.send();
  });
}

export function readFile(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
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
  return array.filter((e) => e !== element);
}

export function secondsToHMS(seconds: number): string {
  return new Date(seconds * 1000).toISOString().substr(11, 12);
}

export function upperCaseFirst(str: string, lowerCaseRest: boolean = true): string {
  let value = str.charAt(0).toUpperCase();
  value += lowerCaseRest ? str.toLowerCase().slice(1) : str.slice(1);
  return value;
}
