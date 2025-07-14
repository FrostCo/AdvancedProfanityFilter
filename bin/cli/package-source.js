/* eslint-disable no-console */
import SourcePackager from '../lib/SourcePackager.js';

const sourcePackager = new SourcePackager();
try {
  await sourcePackager.run();
  console.log(sourcePackager.successMessage('package-source'));
} catch (error) {
  console.error(sourcePackager.errorMessage('package-source'), error);
  process.exit(1);
}
