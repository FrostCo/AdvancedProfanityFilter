/* eslint-disable no-console */
import ExtensionPackager from '../lib/ExtensionPackager.js';

const extensionPackager = new ExtensionPackager();
try {
  extensionPackager.run();
  console.log(extensionPackager.successMessage('pack-extension'));
} catch (error) {
  console.error(extensionPackager.errorMessage('pack-extension'), error);
  process.exit(1);
}
