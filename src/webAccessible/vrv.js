let container = document.createElement('div');
container.id = 'APF-Data-Container';
container.style.display = 'none';
let input = document.createElement('input');
input.id = 'APF-Subtitle-Data';
container.appendChild(input);
document.body.append(container);
input.addEventListener('click', function(evt) {
  if (evt.target.id == 'APF-Subtitle-Data') {
    window.postMessage({ extension: 'APF', type: 'FROM_PAGE', subtitles: window.vilos.content.subtitles });
  }
});
