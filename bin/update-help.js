'use strict';

const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const download = require('download');

let readmeURI = 'https://raw.githubusercontent.com/wiki/richardfrost/AdvancedProfanityFilter/Home.md';
let optionPage = path.join('src/static', 'optionPage.html');
let optionPageHTML = fs.readFileSync(optionPage).toString();
let prefix = '<div id="helpContainer">';
let postfix = '\n  </div>';
let foundMatch = false;

console.log('Downloading Wiki...');
download(readmeURI).then(data => {
  console.log('Parsing markdown...');
  let md = data.toString();
  let html = marked(md);

  let newOptionPageHTML = optionPageHTML.replace(/<div id="helpContainer">.*?<\/div>/s, function(match) {
    foundMatch = true;
    let output = prefix;
    html.split('\n').forEach(line => { if (line.trim() != '') output += `\n    ${line}` });
    return output + postfix;
  });
  if (foundMatch) {
    console.log('Updating Help content...');
    fs.writeFileSync(optionPage, newOptionPageHTML);
  } else {
    throw `Failed to update ${optionPage}`;
  }
});