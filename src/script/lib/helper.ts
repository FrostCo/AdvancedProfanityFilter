import Constants from './Constants';

export interface Version {
  major: number;
  minor: number;
  patch: number;
}

export function booleanToNumber(value: boolean): number {
  return value ? Constants.TRUE : Constants.FALSE;
}

export function deepCloneJson(object) {
  return JSON.parse(JSON.stringify(object));
}

/* istanbul ignore next */
export function dynamicList(
  list: string[],
  select: HTMLSelectElement,
  upperCaseFirstChar: boolean = false,
  title?: string,
) {
  const array = title !== undefined ? [title, ...list] : list;

  const options = array.map((item) => {
    const option = document.createElement('option');
    option.value = title && item === title ? '' : item;
    option.textContent = upperCaseFirstChar ? upperCaseFirst(item) : item;
    return option;
  });

  select.replaceChildren(...options);
}

export function exportToFile(dataStr, fileName = 'data.txt') {
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', fileName);
  linkElement.click();
  linkElement.remove();
}

// Format numbers up to 1B to be 4 characters or less
export function formatNumber(number: number): string {
  const length = number.toString().length;
  if (length <= 3) {
    // 0 - 999
    return number.toString();
  } else if (length <= 6) {
    // 1,000 - 999,999
    const n = (number / 1000).toPrecision();
    const index = n.indexOf('.');
    return (index >= -1 && index <= 1 ? n.slice(0, 3) : n.slice(0, index)) + 'k';
  } else if (length <= 9) {
    // 1,000,000 - 999,999,999
    const n = (number / 1000000).toPrecision();
    const index = n.indexOf('.');
    return (index >= -1 && index <= 1 ? n.slice(0, 3) : n.slice(0, index)) + 'M';
  } else {
    // >= 1,000,000,000
    return '1G+';
  }
}

// Returns the element found by selector string
//   Supports querying through a shadow DOM using '>>>'
export function getElement(selector: string, root: Document | ShadowRoot | HTMLElement = document): HTMLElement {
  return getElementCore(selector, root, 'querySelector') as HTMLElement;
}

// Returns the elements found by selector string
//   Supports querying through a shadow DOM using '>>>'
function getElementCore(
  selector: string,
  root: Document | HTMLElement | ShadowRoot = document,
  queryMethod = 'querySelector',
): HTMLElement | NodeListOf<HTMLElement> {
  let element;
  const domLayers = selector.split(Constants.SELECTOR_SHADOWROOT_DELIMITER);
  const shadowRootCount = domLayers.length - 1;

  // No shadowRoot in selector: return native querySelector[All]
  if (shadowRootCount === 0) return root[queryMethod](selector);

  // shadowRoot in selector: return querySelector[All] through shadowRoot(s)
  while (domLayers.length) {
    if (root) {
      const currentSelector = domLayers.shift().trim();
      if (domLayers.length == 0) {
        return root[queryMethod](currentSelector);
      } else {
        element = root.querySelector(currentSelector);
        if (element) {
          root = element.shadowRoot;
        } else {
          return null;
        }
      }
    } else {
      return null;
    }
  }
}

// Returns the elements found by selector string
//   Supports querying through a shadow DOM using '>>>'
export function getElements(
  selector: string,
  root: Document | HTMLElement | ShadowRoot = document,
): NodeListOf<HTMLElement> {
  return getElementCore(selector, root, 'querySelectorAll') as NodeListOf<HTMLElement>;
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
    patch: parseInt(versionValues[2]),
  };
}

// Object.hasOwn access with a built-in fallback for older environments
export function hasOwn(obj: object | null | undefined, key: PropertyKey): boolean {
  if (obj == null) return false;
  return Object.hasOwn ? Object.hasOwn(obj, key) : Object.prototype.hasOwnProperty.call(obj, key);
}

// NOTE: This function requires the hh:mm:ss.ff format
export function hmsToSeconds(timeStr: string, precision: number = 3): number {
  const [hh = '0', mm = '0', ss = '0'] = (timeStr || '0:0:0').split(':');
  const hour = parseInt(hh, 10) || 0;
  const minute = parseInt(mm, 10) || 0;
  const second = parseFloat(ss) || 0;
  return parseFloat((hour * 3600 + minute * 60 + second).toFixed(precision));
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

export function lastElement(array: any[]): any {
  return array[array.length - 1];
}

export function numberToBoolean(value: number): boolean {
  return value > Constants.FALSE;
}

export function numberWithCommas(number: number | string): string {
  if (typeof Intl == 'object' && typeof Intl.NumberFormat == 'function') {
    if (typeof number === 'string') number = parseInt(number);
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

export function randomArrayElement(array: any[]): string {
  const length = array.length;

  if (length <= 1) return array[0];

  return array[Math.floor(Math.random() * length)];
}

export function readFile(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      resolve(fr.result);
    };
    fr.readAsText(file);
  });
}

export function removeFromArray(array: string[], toRemove: string | string[]) {
  if (typeof toRemove === 'string') return array.filter((e) => e !== toRemove);

  return array.filter((e) => !toRemove.includes(e));
}

export function secondsToHMS(seconds: number): string {
  return new Date(seconds * 1000).toISOString().slice(11, 11 + 12);
}

export function sortObjectKeys(object: any, ignoreUnderscores = true) {
  return Object.keys(object)
    .sort()
    .reduce((obj, key) => {
      if (!ignoreUnderscores || key[0] != '_') obj[key] = object[key];
      return obj;
    }, {});
}

export function stringArray(data: string | string[]): string[] {
  if (typeof data === 'string') data = [data];

  return data;
}

export function timeForFileName() {
  const padded = (num: number) => {
    return ('0' + num).slice(-2);
  };
  const date = new Date();
  const today = `${date.getFullYear()}-${padded(date.getMonth() + 1)}-${padded(date.getDate())}`;
  const time = `${padded(date.getHours())}${padded(date.getMinutes())}${padded(date.getSeconds())}`;
  return `${today}_${time}`;
}

export function truncateString(string: string, length: number, elipses: boolean = true, countElipses: boolean = true) {
  const arr = Array.from(string);
  if (arr.length <= length) return string;
  const truncateLength = elipses && countElipses ? length - 3 : length;
  const truncated = arr.slice(0, truncateLength).join('').trim();
  return elipses ? truncated + '...' : truncated;
}

export function upperCaseFirst(str: string, lowerCaseRest: boolean = true): string {
  let value = str.charAt(0).toUpperCase();
  value += lowerCaseRest ? str.toLowerCase().slice(1) : str.slice(1);
  return value;
}

/**
 * Send message with retry logic for MV3 service worker availability
 * @param message - The message to send
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param fallbackResponse - Default response if all retries fail
 * @returns Promise that resolves with the response
 */
export function sendMessageWithRetry<TResponse = any>(
  message: any,
  maxRetries: number = 3,
  fallbackResponse?: TResponse,
): Promise<TResponse> {
  return new Promise((resolve) => {
    let attempts = 0;

    const attemptSend = () => {
      attempts++;

      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          if (attempts < maxRetries) {
            // Exponential backoff: 100ms, 200ms, 400ms
            const delay = Math.pow(2, attempts - 1) * 100;
            setTimeout(attemptSend, delay);
          } else {
            // All retries failed, use fallback
            resolve(fallbackResponse);
          }
        } else {
          resolve(response || fallbackResponse);
        }
      });
    };

    attemptSend();
  });
}
