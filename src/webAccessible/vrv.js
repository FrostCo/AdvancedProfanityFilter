if (!document.querySelector('script#APF-Data')) {
  let dataEl = document.createElement('APFDATA');
  dataEl.textContent = JSON.stringify(window.vilos.content);
  document.body.append(dataEl);
}
