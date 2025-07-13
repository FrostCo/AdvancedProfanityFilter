/* eslint-disable no-console */
import Prebuild from '../lib/Prebuild.js';

const prebuild = new Prebuild(process.argv);
try {
  prebuild.run();

  // Output any warnings
  if (prebuild.hasWarnings) {
    console.warn('\n⚠️  Warnings:');
    prebuild.warnings.forEach((warning) => {
      console.warn(`  ${warning}`);
    });
    console.warn('');
  }

  console.log(prebuild.successMessage('prebuild'));
} catch (error) {
  console.error(prebuild.errorMessage('prebuild'), error.message);
  process.exit(1);
}
