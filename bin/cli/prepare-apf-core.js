/* eslint-disable no-console */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const packageDir = path.join(projectRoot, 'packages/apf-core');
const distDir = path.join(packageDir, 'dist');
const packageManifestPath = path.join(packageDir, 'package.json');
const licenseSource = path.join(projectRoot, 'LICENSE');
const licenseDestination = path.join(packageDir, 'LICENSE');
const resolvedExtension = /\.(?:[cm]?js|json)$/;
// `from` specifiers and dynamic imports use group 2. Side-effect imports use group 3.
const specifierPatterns = [
  /\bfrom\s*(['"])(\.{1,2}\/[^'"]+)\1/g,
  /\bimport\s*\(\s*(['"])(\.{1,2}\/[^'"]+)\1/g,
  /(^|[\n;])\s*import\s*(['"])(\.{1,2}\/[^'"]+)\2/g,
];

function withJsExtension(specifier) {
  if (resolvedExtension.test(specifier)) return specifier;
  return `${specifier}.js`;
}

function rewriteSpecifiers(source) {
  let rewritten = source;
  for (const pattern of specifierPatterns) {
    pattern.lastIndex = 0;
    rewritten = rewritten.replace(pattern, (match) => {
      return match.replace(/(['"])(\.{1,2}\/[^'"]+)\1/, (_quoted, quote, specifier) => {
        return `${quote}${withJsExtension(specifier)}${quote}`;
      });
    });
  }
  return rewritten;
}

function relativeSpecifiers(source) {
  const specifiers = [];
  for (const pattern of specifierPatterns) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      specifiers.push(match[2].startsWith('.') ? match[2] : match[3]);
    }
  }
  return specifiers;
}

function assertResolvedSpecifiers(source, fileName) {
  for (const specifier of relativeSpecifiers(source)) {
    if (!resolvedExtension.test(specifier)) {
      throw new Error(`${fileName} has an unresolved relative import: ${specifier}`);
    }
  }
  if (source.includes('require(')) {
    throw new Error(`${fileName} contains a CommonJS require()`);
  }
}

async function allowedPackageFiles() {
  const manifest = await fs.readJson(packageManifestPath);
  return new Set(manifest.files);
}

async function clean() {
  await fs.remove(distDir);
  await fs.remove(licenseDestination);
}

async function finalize() {
  const outputNames = await fs.readdir(distDir);
  for (const fileName of outputNames) {
    if (!fileName.endsWith('.js') && !fileName.endsWith('.d.ts')) {
      throw new Error(`Unexpected package output: ${fileName}`);
    }

    const filePath = path.join(distDir, fileName);
    const source = await fs.readFile(filePath, 'utf8');
    const rewritten = rewriteSpecifiers(source);
    assertResolvedSpecifiers(rewritten, fileName);
    await fs.writeFile(filePath, rewritten);
  }

  await fs.copy(licenseSource, licenseDestination);

  const allowed = await allowedPackageFiles();
  const actual = new Set(['LICENSE', ...outputNames.map((fileName) => `dist/${fileName}`)]);
  const missing = [...allowed].filter((fileName) => !actual.has(fileName));
  const extra = [...actual].filter((fileName) => !allowed.has(fileName));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `Package files allowlist does not match build output. Missing: ${missing.join(', ') || 'none'}. Extra: ${extra.join(', ') || 'none'}.`,
    );
  }

  console.log('Prepared @frostco/apf-core package output');
}

if (process.argv.includes('--clean')) {
  await clean();
} else {
  await finalize();
}
