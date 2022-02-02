/* eslint-disable no-console */
import fse from 'fs-extra';
import path from 'path';

function main() {
  try {
    // argv[0] = process (node)
    // argv[1] = script (this file)
    // argv[2] = first argument
    if (process.argv.length >= 2) {
      const args = process.argv.slice(2);
      switch (args[0]) {
        case '--apple':
          postbuildApple();
          break;
        default:
          postbuildDefault();
      }
    } else {
      usage();
    }
  } catch (error) {
    console.log(error);
    usage();
  }
}

function postbuildApple() {
  const files = [
    path.join('dist', 'img', 'donate.gif'),
    path.join('dist', 'img', 'patreon-small.png'),
    path.join('dist', 'img', 'patreon.png'),
  ];

  removeOptionPageDonations();
  removeFiles(files);
}

function postbuildDefault() {

}

function removeOptionPageDonations() {
  console.log("Removing donations from Option's page");
  const optionPage = path.join('dist', 'optionPage.html');
  const optionPageHTML = fse.readFileSync(optionPage).toString();

  // Remove span.donations
  const donationsRegex = new RegExp('[\\s\\S]{4}<span class="donations">[\\s\\S].*[\\s\\S]+?<\/span>');
  const newOptionPageHTML = optionPageHTML.replace(donationsRegex, '');

  // Save changes
  fse.writeFileSync(optionPage, newOptionPageHTML);
}

function removeFiles(files) {
  if (typeof files === 'string') {
    files = [files];
  }

  files.forEach((file) => {
    console.log(`Removing ${file}`);
    fse.removeSync(file);
  });
}

function usage() {
  console.log(`usage:
      npm run postbuild
      npm run postbuild:apple
  `);
}

main();
