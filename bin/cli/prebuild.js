/* eslint-disable no-console */
import Prebuild from '../lib/Prebuild.js';

const prebuild = new Prebuild(process.argv);
try {
  prebuild.run();
  console.log(prebuild.successMessage('prebuild'));

  if (prebuild.hasWarnings) {
    console.warn(' ⚠️  Warnings:');
    prebuild.warnings.forEach((warning) => {
      console.warn(`  ${warning}`);
    });
    console.warn('');
  }
} catch (error) {
  console.error(prebuild.errorMessage('prebuild'), error.message);
  process.exit(1);
}
