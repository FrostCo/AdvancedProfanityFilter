import fs from 'fs';
import path from 'path';

const localesDir = path.join('locales');
const translations = {};

// Iterate through each language directory (e.g., 'en', 'fr')
fs.readdirSync(localesDir).forEach((locale) => {
  translations[locale] = {};
  const localeDir = path.join(localesDir, locale);

  // Iterate through each namespace file in the language directory
  fs.readdirSync(localeDir).forEach((file) => {
    const namespace = path.basename(file, '.json');
    const filePath = path.join(localeDir, file);
    const fileContents = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Assign the namespace contents to the appropriate language
    translations[locale][namespace] = fileContents;
  });
});

// Output the result as a JS object
const output = `export const translations = ${JSON.stringify(translations, null, 2)};\n\nexport default translations;\n`;

// Write the output to a JS file
fs.writeFileSync(path.join('src', 'script', 'translations.js'), output, 'utf8');
