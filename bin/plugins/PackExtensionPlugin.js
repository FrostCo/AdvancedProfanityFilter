/* eslint-disable no-console */
import ExtensionPackager from '../lib/ExtensionPackager.js';

export class PackExtensionPlugin {
  apply(compiler) {
    compiler.hooks.done.tapPromise('ZipExtensionPlugin', async () => {
      const packager = new ExtensionPackager();
      if (!packager.shouldPackage()) return;

      try {
        await packager.run();
        console.log(packager.successMessage('PackExtensionPlugin'));
      } catch (error) {
        console.error(packager.errorMessage('PackExtensionPlugin'), error);
      }
    });
  }
}
