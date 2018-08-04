export function arrayContains(array, element) {
    return (array.indexOf(element) > -1);
}
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
export function removeFromArray(array, element) {
    return array.filter(e => e !== element);
}
