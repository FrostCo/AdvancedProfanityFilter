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

// Format numbers up 994,999,999 (990M) 4 characters
export function formatNumber(number: number): string {
  let length = number.toString().length;
  if (length <= 3) {
    return number.toString();
  } else if (length <= 5) {
    return Number((number/1000).toPrecision(2)).toString() + 'K';
  } else if (length >= 6) {
    if (number <= 999499) {
      return Number((number/1000).toPrecision(3)).toString() + 'K';
    } else {
      return Number((number/1000000).toPrecision(2)).toString() + 'M';
    }
  }
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