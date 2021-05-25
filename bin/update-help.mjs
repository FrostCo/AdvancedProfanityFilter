/* eslint-disable no-console */
import fse from 'fs-extra';
import path from 'path';
import marked from 'marked';
import download from 'download';

const readmeURI = 'https://raw.githubusercontent.com/wiki/richardfrost/AdvancedProfanityFilter/Home.md';
const optionPage = path.join('src/static', 'optionPage.html');
const optionPageHTML = fse.readFileSync(optionPage).toString();
const prefix = '<div id="helpContainer">';
const postfix = '\n  </div>';
let foundMatch = false;

console.log('Downloading Wiki...');
download(readmeURI).then((data) => {
  console.log('Parsing markdown...');
  const md = data.toString();
  const html = marked(md);

  const newOptionPageHTML = optionPageHTML.replace(/<div id="helpContainer">.*?<\/div>/s, function(match) {
    foundMatch = true;
    let output = prefix;
    html.split('\n').forEach((line) => { if (line.trim() != '') output += `\n    ${line}`; });
    return output + postfix;
  });
  if (foundMatch) {
    console.log('Updating Help content...');
    fse.writeFileSync(optionPage, newOptionPageHTML);
  } else {
    throw `Failed to update ${optionPage}`;
  }
});
