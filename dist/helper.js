export function arrayContains(array, element) {
    return (array.indexOf(element) > -1);
}
/* istanbul ignore next */
export function dynamicList(list, selectEm, title) {
    let options = '';
    if (title !== undefined) {
        options = '<option value="" disabled selected>' + title + '</option>';
    }
    for (let i = 0; i < list.length; i++) {
        options += '<option value="' + list[i] + '">' + list[i] + '</option>';
    }
    document.getElementById(selectEm).innerHTML = options;
}
// /^\d+\.\d+\.\d+$/
export function getVersion(version) {
    let versionValues = version.split('.');
    return {
        major: parseInt(versionValues[0]),
        minor: parseInt(versionValues[1]),
        patch: parseInt(versionValues[2])
    };
}
// Is the provided version lower than or equal to the minimum version?
export function isVersionOlder(version, minimum) {
    if (version.major < minimum.major) {
        return true;
    }
    else if (version.major == minimum.major && version.minor < minimum.minor) {
        return true;
    }
    else if (version.major == minimum.major && version.minor == minimum.minor && version.patch <= minimum.patch) {
        return true;
    }
    return false;
}
export function removeFromArray(array, element) {
    return array.filter(e => e !== element);
}
