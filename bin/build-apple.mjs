import fse from 'fs-extra';
import path from 'path';

function cleanupFiles() {
  fse.removeSync(path.join('dist', 'img', 'donate.gif'));
  fse.removeSync(path.join('dist', 'img', 'patreon-small.png'));
  fse.removeSync(path.join('dist', 'img', 'patreon.png'));
}

function updateOptionsPage() {
  const optionPage = path.join('dist', 'optionPage.html');
  const optionPageHTML = fse.readFileSync(optionPage).toString();

  // Remove span.donations
  const donationsRegex = new RegExp('[\\s\\S]{4}<span class="donations">[\\s\\S].*[\\s\\S]+?<\/span>');
  const newOptionPageHTML = optionPageHTML.replace(donationsRegex, '');

  // Save changes
  fse.writeFileSync(optionPage, newOptionPageHTML);
}

cleanupFiles();
updateOptionsPage();
