// export class Helper {
function arrayContains(array: string[], element: string) {
  return (array.indexOf(element) > -1);
}

function dynamicList(list, selectEm, title?: string) {
  let options = '';
  if (title !== undefined) {
    options = '<option value="" disabled selected>' + title + '</option>';
  }

  for(let i = 0; i < list.length; i++) {
    options += '<option value="'+list[i]+'">'+list[i]+'</option>';
  }
  document.getElementById(selectEm).innerHTML = options;
}

function removeFromArray(array: string[], element: string) {
  return array.filter(e => e !== element);
}