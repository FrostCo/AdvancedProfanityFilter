import Constants from './constants';

export function booleanToNumber(value: boolean): number {
  return value ? Constants.TRUE : Constants.FALSE;
}

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
    return ((index >= -1 && index <= 1) ? n.slice(0, 3) : n.slice(0, index)) + 'k';
  } else if (length <= 9) { // 1,000,000 - 999,999,999
    const n = (number/1000000).toPrecision();
    const index = n.indexOf('.');
    return ((index >= -1 && index <= 1) ? n.slice(0, 3) : n.slice(0, index)) + 'M';
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

export function getGlobalVariableFromBackground(globalVariable: string) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ globalVariable: globalVariable }, (response) => {
      resolve(response);
    });
  });
}

export function getParent(node: HTMLElement, level: number = 1): HTMLElement {
  if (!node) {
    return null;
  } else if (level > 0) {
    return getParent(node.parentElement, level - 1);
  } else {
    return node;
  }
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

export function makeBackgroundRequest(url: string, method: string) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ fetch: url, fetchMethod: method.toUpperCase() }, (response) => {
      resolve(response);
    });
  });
}

export async function makeFetchRequest(url: string, method: string = 'GET') {
  const response = await fetch(url, { method: method });
  const data = await response.text();
  return data;
}

export async function makeRequest(url: string, method: string) {
  return fetch ? await makeFetchRequest(url, method) : await makeXMLHttpRequest(url, method) ;
}

export function makeXMLHttpRequest(url: string, method: string) {
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

export function numberToBoolean(value: number): boolean {
  return value > Constants.FALSE;
}

export function numberWithCommas(number: number | string): string {
  if (typeof Intl == 'object' && typeof Intl.NumberFormat == 'function') {
    if (typeof number === 'string') {
      number = parseInt(number).toString();
    }

    return number.toLocaleString();
  } else {
    number = number.toString();

    // Get numbers before `.` (if present)
    const decimalIndex = number.indexOf('.');
    let output = decimalIndex === -1 ? number : number.slice(0, decimalIndex);

    // Insert commas every 3 digits from the right
    for (let i = output.length - 3; i > 0; i -= 3) {
      output = output.slice(0, i) + ',' + output.slice(i);
    }

    // Append fractional part
    if (decimalIndex !== -1) {
      output += number.slice(decimalIndex);
    }

    return output;
  }
}

export function prettyPrintArray(array: string[]) {
  return `[${array.toString().replace(/,/g, ', ')}]`;
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
  return new Date(seconds * 1000).toISOString().slice(11, (11 + 12));
}

export function stringArray(data: string | string[]): string[] {
  if (typeof data === 'string') {
    data = [data];
  }

  return data;
}

export function upperCaseFirst(str: string, lowerCaseRest: boolean = true): string {
  let value = str.charAt(0).toUpperCase();
  value += lowerCaseRest ? str.toLowerCase().slice(1) : str.slice(1);
  return value;
}
